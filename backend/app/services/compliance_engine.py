import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.compliance_rule import ComplianceRule
from app.models.compliance_check import ComplianceCheck, ComplianceResult
from app.schemas.compliance_schema import ComplianceResultItem, ComplianceCheckResponse

STATUTORY_DISCLAIMER = (
    "STATUTORY ASSISTANCE DISCLAIMER: This automated compliance check is an algorithmic decision-support "
    "and pre-screening tool operated under the Directorate of Legal Metrology, Ministry of Consumer Affairs. "
    "It does not constitute a formal certificate of conformity nor a substitute for statutory inspection, "
    "physical verification, or adjudication by an authorized Legal Metrology Officer under the Legal Metrology Act, 2009."
)

class ComplianceEngine:
    def __init__(self, db: Session):
        self.db = db

    def evaluate_field_condition(
        self,
        condition: str,
        actual_val: Any,
        expected_val: Any,
        data: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """
        Evaluates a single condition.
        Returns (passed: bool, note: str).
        """
        val_str = str(actual_val).strip() if actual_val is not None else ""

        if condition in ("EXISTS", "NOT_EMPTY"):
            if not actual_val:
                return False, "Field is empty or missing"
            if isinstance(actual_val, str) and not actual_val.strip():
                return False, "Field contains only blank whitespace"
            return True, "Mandatory declaration is present"

        elif condition == "UNIT_VALID":
            # Legal Metrology Standard Units under Rule 12: g, kg, ml, l, N, U
            # Non-standard prohibited abbreviations: gms, gm, gm., kgs, ltrs, ltr, ml.
            prohibited_units = ["gms", "gm", "gm.", "kgs", "ltr", "ltrs", "ml.", "nos", "pcs"]
            cleaned_unit = val_str.lower().strip()
            
            if cleaned_unit in prohibited_units:
                return False, f"Prohibited non-standard unit '{val_str}' used. Rule 12 strictly mandates standard metric units (g, kg, ml, l, N, U)."
            
            allowed = [u.strip().lower() for u in (expected_val or "g,kg,ml,l,N,U").split(",")]
            if cleaned_unit in allowed:
                return True, f"Standard metric unit '{val_str}' conforms to Rule 12"
            return False, f"Unit '{val_str}' is not in authorized metric denominations ({', '.join(allowed)})"

        elif condition == "MRP_TAX_INCLUSIVE":
            # Rule 6(1)(e): MRP must explicitly include '(inclusive of all taxes)' or 'incl. of all taxes'
            declaration_text = (data.get("mrp_declaration_text") or "").lower()
            raw_text = (data.get("extracted_text") or "").lower()
            combined = f"{val_str} {declaration_text} {raw_text}".lower()

            patterns = [
                r"inclusive\s+of\s+all\s+taxes",
                r"incl\.?\s+of\s+all\s+taxes",
                r"incl\.?\s+all\s+taxes",
                r"incl\s+taxes"
            ]
            for pat in patterns:
                if re.search(pat, combined):
                    return True, "Mandatory tax inclusion declaration '(inclusive of all taxes)' is present"
            return False, "Missing mandatory tax inclusion phrase: 'inclusive of all taxes' or 'incl. of all taxes' as mandated by Rule 6(1)(e)"

        elif condition == "UNIT_SALE_PRICE_REQUIRED":
            # Rule 6(1)(f): If net quantity is > 1000g / 1kg or > 1000ml / 1L, Unit Sale Price (USP) must be declared
            net_qty = float(data.get("net_quantity") or 0.0)
            unit = str(data.get("unit") or "").lower()
            usp = data.get("unit_sale_price")

            is_bulk = False
            if unit == "kg" and net_qty > 1.0:
                is_bulk = True
            elif unit == "g" and net_qty > 1000.0:
                is_bulk = True
            elif unit == "l" and net_qty > 1.0:
                is_bulk = True
            elif unit == "ml" and net_qty > 1000.0:
                is_bulk = True

            if is_bulk:
                if usp and str(usp).strip():
                    return True, f"Bulk pack ({net_qty} {unit}) properly declares Unit Sale Price: {usp}"
                return False, f"Package net quantity ({net_qty} {unit}) exceeds 1 kg/1 L threshold, requiring mandatory Unit Sale Price (USP) under Rule 6(1)(f)"
            return True, "Package is under 1 kg/1 L bulk threshold (Unit Sale Price optional or not strictly mandatory)"

        elif condition == "PIN_CODE_PRESENT":
            # Rule 6(1)(a): Address of manufacturer/packer must contain a valid 6-digit Indian PIN code
            pin_match = re.search(r"\b[1-9][0-9]{5}\b", val_str)
            if pin_match:
                return True, f"Full postal address verified with valid 6-digit PIN code: {pin_match.group(0)}"
            return False, "Manufacturer/Packer address lacks mandatory 6-digit postal PIN code for complete traceability"

        elif condition == "DATE_FORMAT":
            # Rule 6(1)(d): Month and Year of manufacture/packing must be formatted as MM/YYYY or Month YYYY
            if not val_str:
                return False, "Date declaration is absent"
            date_patterns = [
                r"^(0[1-9]|1[0-2])\/?(20\d{2}|\d{2})$",  # 08/2026 or 08/26
                r"^(0[1-9]|[12]\d|3[01])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](20\d{2})$", # 15/08/2026
                r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})$"  # August 2026
            ]
            for pat in date_patterns:
                if re.search(pat, val_str, re.IGNORECASE):
                    return True, f"Date format '{val_str}' conforms to Rule 6(1)(d)"
            return False, f"Invalid date declaration '{val_str}'. Must follow MM/YYYY or Month YYYY format."

        elif condition == "REGEX":
            if not val_str:
                return False, "Value missing for regex evaluation"
            if re.search(expected_val, val_str, re.IGNORECASE):
                return True, "Value matches statutory format"
            return False, f"Value '{val_str}' does not conform to statutory pattern"

        elif condition == "IN":
            allowed = [x.strip().lower() for x in (expected_val or "").split(",")]
            if val_str.lower() in allowed:
                return True, f"Value '{val_str}' is valid"
            return False, f"Value '{val_str}' is not in permitted list: {expected_val}"

        elif condition == "GT":
            try:
                num = float(actual_val)
                threshold = float(expected_val)
                if num > threshold:
                    return True, f"Value {num} is greater than required {threshold}"
                return False, f"Value {num} must be greater than {threshold}"
            except (ValueError, TypeError):
                return False, "Numeric value required for GT condition"

        elif condition == "LT":
            try:
                num = float(actual_val)
                threshold = float(expected_val)
                if num < threshold:
                    return True, f"Value {num} is less than {threshold}"
                return False, f"Value {num} exceeds maximum permitted threshold {threshold}"
            except (ValueError, TypeError):
                return False, "Numeric value required for LT condition"

        elif condition == "EQ":
            if val_str.lower() == str(expected_val).strip().lower():
                return True, "Value strictly matches statutory requirement"
            return False, f"Expected '{expected_val}', got '{val_str}'"

        # Default fallback
        if actual_val:
            return True, "Declaration present"
        return False, "Declaration missing"

    def run_compliance_check(
        self,
        product_data: Dict[str, Any],
        user_id: int = None,
        save_to_db: bool = True
    ) -> ComplianceCheckResponse:
        """
        Executes dynamic rule check against active rules stored in database.
        """
        # Fetch active rules from DB
        rules: List[ComplianceRule] = (
            self.db.query(ComplianceRule)
            .filter(ComplianceRule.active == True)
            .order_by(ComplianceRule.weight.desc())
            .all()
        )

        total_weight = 0
        earned_weight = 0
        critical_failed = False
        results: List[ComplianceResultItem] = []
        passed_count = 0
        failed_count = 0
        warning_count = 0

        for rule in rules:
            field_name = rule.field_to_check
            actual_val = product_data.get(field_name)
            
            # If checking manufacturer address or packer address
            if field_name == "manufacturer_or_packer":
                actual_val = product_data.get("manufacturer_name") or product_data.get("packer_name") or product_data.get("importer_name")

            rule_weight = rule.weight or 10
            total_weight += rule_weight

            passed, evaluation_note = self.evaluate_field_condition(
                condition=rule.condition,
                actual_val=actual_val,
                expected_val=rule.expected_value,
                data=product_data
            )

            if passed:
                earned_weight += rule_weight
                result_status = "PASSED"
                passed_count += 1
                rec_action = "Maintain compliant declaration in future packaging batches."
                explanation = evaluation_note
            else:
                if rule.severity == "LOW":
                    result_status = "WARNING"
                    warning_count += 1
                    earned_weight += (rule_weight * 0.5)  # Partial credit for minor warning
                    rec_action = rule.recommended_action or "Review and update minor label deficiency."
                else:
                    result_status = "FAILED"
                    failed_count += 1
                    if rule.severity == "CRITICAL":
                        critical_failed = True
                    rec_action = rule.recommended_action or "Rectify label immediately prior to commercial sale."
                explanation = f"{rule.explanation or ''} Note: {evaluation_note}".strip()

            results.append(
                ComplianceResultItem(
                    rule_id=rule.id,
                    rule_code=rule.rule_code,
                    rule_name=rule.rule_name,
                    legal_reference=rule.legal_reference,
                    result=result_status,
                    severity=rule.severity,
                    actual_value=str(actual_val) if actual_val is not None else "NOT_DECLARED",
                    expected_value=rule.expected_value or "Statutory Compliance",
                    explanation=explanation,
                    recommended_action=rec_action
                )
            )

        # Calculate final compliance score (0 - 100)
        score = 0.0
        if total_weight > 0:
            score = round((earned_weight / total_weight) * 100.0, 1)

        # Determine overall status
        if critical_failed or score < 60.0:
            overall_status = "NON-COMPLIANT"
            summary = (
                f"NON-COMPLIANT: Package violates {failed_count} statutory declaration rule(s) "
                f"under Legal Metrology (Packaged Commodities) Rules, 2011. Immediate corrective action required."
            )
        elif score >= 90.0 and failed_count == 0:
            overall_status = "COMPLIANT"
            summary = (
                f"COMPLIANT: All {passed_count} evaluated statutory declarations conform to "
                f"the Legal Metrology (Packaged Commodities) Rules, 2011."
            )
        else:
            overall_status = "NEEDS MANUAL REVIEW"
            summary = (
                f"NEEDS MANUAL REVIEW: Package scored {score}/100 with {failed_count} failure(s) "
                f"and {warning_count} warning(s). Physical label verification recommended by Legal Metrology Officer."
            )

        check_record = None
        if save_to_db:
            product_id = product_data.get("product_id")
            check_record = ComplianceCheck(
                product_id=product_id,
                checked_by=user_id,
                score=score,
                status=overall_status,
                passed_count=passed_count,
                failed_count=failed_count,
                warning_count=warning_count,
                summary=summary,
                checked_at=datetime.now(timezone.utc)
            )
            self.db.add(check_record)
            self.db.commit()
            self.db.refresh(check_record)

            # Save individual result breakdown
            for item in results:
                db_result = ComplianceResult(
                    check_id=check_record.id,
                    rule_id=item.rule_id,
                    rule_code=item.rule_code,
                    rule_name=item.rule_name,
                    legal_reference=item.legal_reference,
                    result=item.result,
                    severity=item.severity,
                    actual_value=item.actual_value,
                    expected_value=item.expected_value,
                    explanation=item.explanation,
                    recommended_action=item.recommended_action
                )
                self.db.add(db_result)
            self.db.commit()

        return ComplianceCheckResponse(
            id=check_record.id if check_record else None,
            product_id=product_data.get("product_id"),
            score=score,
            status=overall_status,
            passed_count=passed_count,
            failed_count=failed_count,
            warning_count=warning_count,
            summary=summary,
            disclaimer=STATUTORY_DISCLAIMER,
            results=results,
            checked_at=datetime.now(timezone.utc)
        )
