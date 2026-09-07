import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_REPORTS_DIR = str(PROJECT_ROOT / "uploads" / "reports")

class ReportGenerator:
    def __init__(self, output_dir: str = DEFAULT_REPORTS_DIR):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_inspection_pdf(
        self,
        inspection_data: Dict[str, Any],
        product_data: Dict[str, Any],
        compliance_check: Dict[str, Any],
        inspector_name: str
    ) -> str:
        """
        Generates official Legal Metrology inspection and compliance PDF certificate.
        Returns the absolute filepath of the generated PDF.
        """
        insp_num = inspection_data.get("inspection_number", f"INSP-{int(datetime.now(timezone.utc).timestamp())}")
        filename = f"Inspection_Report_{insp_num}.pdf"
        filepath = os.path.join(self.output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'GovHeaderTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            alignment=1,
            textColor=colors.HexColor('#1E3A8A')
        )

        sub_style = ParagraphStyle(
            'GovHeaderSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.HexColor('#334155')
        )

        doc_title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            alignment=1,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=10
        )

        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1E3A8A'),
            spaceBefore=8,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#1E293B')
        )

        body_bold = ParagraphStyle(
            'BodyDarkBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        status_compliant = ParagraphStyle('StatComp', parent=body_bold, textColor=colors.HexColor('#059669'))
        status_violation = ParagraphStyle('StatViol', parent=body_bold, textColor=colors.HexColor('#DC2626'))
        status_review = ParagraphStyle('StatRev', parent=body_bold, textColor=colors.HexColor('#D97706'))

        story = []

        # 1. Government Emblem / Header Banner
        story.append(Paragraph("GOVERNMENT OF INDIA", title_style))
        story.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", title_style))
        story.append(Paragraph("DEPARTMENT OF CONSUMER AFFAIRS • DIRECTORATE OF LEGAL METROLOGY", sub_style))
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=8))
        story.append(Paragraph("STATUTORY PACKAGED COMMODITY INSPECTION REPORT", doc_title_style))
        story.append(Paragraph(
            "Issued under the Provisions of the Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011",
            sub_style
        ))
        story.append(Spacer(1, 10))

        # 2. Meta Docket Table
        status_str = inspection_data.get("status", "PENDING")
        score = compliance_check.get("score", 0.0)

        status_para = status_compliant if "COMPLIANT" in status_str else (
            status_violation if "VIOLATION" in status_str or "SEIZURE" in status_str else status_review
        )

        meta_data = [
            [
                Paragraph("<b>Inspection ID:</b>", body_style),
                Paragraph(insp_num, body_bold),
                Paragraph("<b>Inspection Date:</b>", body_style),
                Paragraph(datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M UTC"), body_style)
            ],
            [
                Paragraph("<b>Enforcement Officer:</b>", body_style),
                Paragraph(inspector_name, body_style),
                Paragraph("<b>Location / Establishment:</b>", body_style),
                Paragraph(inspection_data.get("location") or inspection_data.get("store_name") or "On-Site Retail Docket", body_style)
            ],
            [
                Paragraph("<b>Compliance Score:</b>", body_style),
                Paragraph(f"<b>{score}/100</b>", body_bold),
                Paragraph("<b>Statutory Status:</b>", body_style),
                Paragraph(status_str, status_para)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[1.4*inch, 2.2*inch, 1.4*inch, 2.2*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # 3. Product & Package Declarations
        story.append(Paragraph("I. PACKAGED COMMODITY DECLARATIONS EVALUATED", h2_style))
        prod_data = [
            [
                Paragraph("<b>Commodity / Brand:</b>", body_style),
                Paragraph(f"{product_data.get('product_name', 'N/A')} ({product_data.get('brand', 'Generic')})", body_style),
                Paragraph("<b>Net Quantity:</b>", body_style),
                Paragraph(f"{product_data.get('net_quantity', 'N/A')} {product_data.get('unit', '')}", body_style)
            ],
            [
                Paragraph("<b>Declared MRP:</b>", body_style),
                Paragraph(f"₹ {product_data.get('mrp', '0.00')} ({product_data.get('mrp_declaration_text') or 'Standard'})", body_style),
                Paragraph("<b>Unit Sale Price:</b>", body_style),
                Paragraph(product_data.get('unit_sale_price') or "Not Declared", body_style)
            ],
            [
                Paragraph("<b>Batch / Lot No:</b>", body_style),
                Paragraph(product_data.get('batch_number') or "N/A", body_style),
                Paragraph("<b>Mfg / Pkg Date:</b>", body_style),
                Paragraph(product_data.get('manufacturing_date') or "N/A", body_style)
            ],
            [
                Paragraph("<b>Manufacturer / Packer:</b>", body_style),
                Paragraph(f"{product_data.get('manufacturer_name') or 'N/A'}<br/>{product_data.get('manufacturer_address') or ''}", body_style),
                Paragraph("<b>Country of Origin:</b>", body_style),
                Paragraph(product_data.get('country_of_origin') or "India", body_style)
            ],
            [
                Paragraph("<b>Grievance Redressal:</b>", body_style),
                Paragraph(f"Phone: {product_data.get('customer_care_phone') or 'N/A'}<br/>Email: {product_data.get('customer_care_email') or 'N/A'}", body_style),
                Paragraph("<b>Expiry Date:</b>", body_style),
                Paragraph(product_data.get('expiry_date') or "Best Before Std", body_style)
            ]
        ]
        prod_table = Table(prod_data, colWidths=[1.4*inch, 2.2*inch, 1.4*inch, 2.2*inch])
        prod_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(prod_table)
        story.append(Spacer(1, 10))

        # 4. Compliance Rule Findings Table
        story.append(Paragraph("II. STATUTORY COMPLIANCE EVALUATION & VIOLATION MATRIX", h2_style))
        
        rule_rows = [
            [
                Paragraph("<b>Rule / Clause</b>", body_bold),
                Paragraph("<b>Statutory Declaration Check</b>", body_bold),
                Paragraph("<b>Result</b>", body_bold),
                Paragraph("<b>Severity</b>", body_bold),
                Paragraph("<b>Observed Value / Finding</b>", body_bold)
            ]
        ]

        results = compliance_check.get("results", [])
        for res in results[:10]:  # Up to 10 key findings in table
            res_val = res.get("result", "PASSED")
            res_style = status_compliant if res_val == "PASSED" else (status_violation if res_val == "FAILED" else status_review)
            
            rule_rows.append([
                Paragraph(res.get("rule_code", "LMR-2011"), body_style),
                Paragraph(f"<b>{res.get('rule_name', '')}</b><br/><font size=7 color='#64748B'>{res.get('legal_reference') or ''}</font>", body_style),
                Paragraph(res_val, res_style),
                Paragraph(res.get("severity", "HIGH"), body_style),
                Paragraph(f"{res.get('explanation') or res.get('actual_value')}", body_style)
            ])

        rule_table = Table(rule_rows, colWidths=[1.0*inch, 2.2*inch, 0.9*inch, 0.8*inch, 2.3*inch])
        rule_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('TOPPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(rule_table)
        story.append(Spacer(1, 10))

        # 5. Inspector Remarks & Statutory Action
        story.append(KeepTogether([
            Paragraph("III. STATUTORY ACTION & ENFORCEMENT ORDER", h2_style),
            Paragraph(f"<b>Inspector Remarks:</b> {inspection_data.get('remarks') or 'Routine packaged commodity surveillance audit.'}", body_style),
            Spacer(1, 4),
            Paragraph(
                "<b>Statutory Penalty Clause Applicable:</b> Section 36(1) of Legal Metrology Act, 2009 "
                "(First Offence fine up to ₹ 25,000/-; Second Offence fine up to ₹ 50,000/-; Subsequent imprisonment up to 1 year).",
                body_style
            ),
            Spacer(1, 16),
            Table([
                [
                    Paragraph("<b>Inspecting Legal Metrology Officer</b><br/>Directorate of Legal Metrology<br/>Government of India", body_style),
                    Paragraph("<b>Official Verification Seal</b><br/>[ DIGITALLY ATTESTED ]<br/>Doc Ref: " + insp_num, body_style)
                ]
            ], colWidths=[3.6*inch, 3.6*inch]),
            Spacer(1, 12),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceAfter=4),
            Paragraph(
                "<i>DISCLAIMER: This document is an official digital record generated under the Legal Metrology Compliance "
                "& Inspection System. Valid for regulatory review and pre-trial compounding under Section 48.</i>",
                ParagraphStyle('Foot', parent=body_style, fontSize=7, textColor=colors.HexColor('#64748B'))
            )
        ]))

        doc.build(story)
        return filepath

    def generate_statutory_notice_pdf(
        self,
        notice_data: Dict[str, Any],
        officer_name: str
    ) -> str:
        """
        Generates official Legal Metrology Statutory Show-Cause Notice under Section 15 & 36.
        Returns the absolute filepath of the generated PDF.
        """
        notice_id = notice_data.get("notice_id", f"NOTICE-LMR-{int(datetime.now(timezone.utc).timestamp())}")
        filename = f"Statutory_Notice_{notice_id}.pdf"
        filepath = os.path.join(self.output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'NoticeGovTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11.5,
            leading=14,
            alignment=1,
            textColor=colors.HexColor('#003366')
        )

        sub_style = ParagraphStyle(
            'NoticeGovSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.HexColor('#475569')
        )

        doc_title_style = ParagraphStyle(
            'NoticeTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            alignment=1,
            textColor=colors.HexColor('#DC2626'),
            spaceBefore=6,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            'NoticeBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1E293B')
        )

        body_bold = ParagraphStyle(
            'NoticeBodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        story = []

        # 1. Government Header Banner
        story.append(Paragraph("GOVERNMENT OF INDIA", title_style))
        story.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", title_style))
        story.append(Paragraph("DIRECTORATE OF LEGAL METROLOGY • ENFORCEMENT & COMPLIANCE WING", sub_style))
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#003366'), spaceAfter=8))
        story.append(Paragraph("STATUTORY SHOW-CAUSE NOTICE OF VIOLATION", doc_title_style))
        story.append(Paragraph(
            "Issued under Section 15 &amp; Section 36 of the Legal Metrology Act, 2009 read with Legal Metrology (Packaged Commodities) Rules, 2011",
            sub_style
        ))
        story.append(Spacer(1, 10))

        # 2. Docket & Notice Meta Table
        meta_table_data = [
            [
                Paragraph("<b>Notice Reference No:</b>", body_style),
                Paragraph(notice_id, body_bold),
                Paragraph("<b>Date of Issuance:</b>", body_style),
                Paragraph(datetime.now(timezone.utc).strftime("%d-%b-%Y"), body_style)
            ],
            [
                Paragraph("<b>Consumer Docket ID:</b>", body_style),
                Paragraph(str(notice_data.get("docket_id", "N/A")), body_bold),
                Paragraph("<b>Response Deadline:</b>", body_style),
                Paragraph(f"{notice_data.get('compliance_deadline_days', 15)} Calendar Days", body_bold)
            ]
        ]
        t_meta = Table(meta_table_data, colWidths=[1.8 * inch, 2.0 * inch, 1.6 * inch, 1.8 * inch])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 12))

        # 3. Addressee Particulars
        company_name = notice_data.get("company_name", "Managing Director / Authorized Signatory")
        company_address = notice_data.get("company_address", "Registered Establishment Address")
        company_email = notice_data.get("company_email", "compliance@company.com")

        story.append(Paragraph("<b>TO:</b>", body_bold))
        story.append(Paragraph(f"<b>The Principal Officer / Managing Director</b>", body_style))
        story.append(Paragraph(f"<b>{company_name}</b>", body_bold))
        story.append(Paragraph(f"{company_address}", body_style))
        story.append(Paragraph(f"Official Electronic Contact: {company_email}", body_style))
        story.append(Spacer(1, 10))

        # 4. Offence Particulars Table
        story.append(Paragraph("<b>1. PARTICULARS OF PACKAGED COMMODITY &amp; RECORDED VIOLATION:</b>", body_bold))
        desc = notice_data.get("complaint_description") or notice_data.get("inspection_summary") or "Statutory inspection detected non-compliances under Legal Metrology Rules, 2011."
        offence_data = [
            [Paragraph("<b>Packaged Commodity:</b>", body_style), Paragraph(str(notice_data.get("product_name", "Packaged Commodity")), body_style)],
            [Paragraph("<b>Brand / Trademark:</b>", body_style), Paragraph(str(notice_data.get("brand", "N/A")), body_style)],
            [Paragraph("<b>Batch / Lot No:</b>", body_style), Paragraph(str(notice_data.get("batch_number", "Declared Batch on Label")), body_style)],
            [Paragraph("<b>Statutory Act &amp; Clause Violated:</b>", body_style), Paragraph(f"<font color='#DC2626'><b>{notice_data.get('section_violated', 'Section 36(1) / Rule 6(1), LMR 2011')}</b></font>", body_style)],
            [Paragraph("<b>Inspection Findings:</b>", body_style), Paragraph(str(desc), body_style)],
        ]
        violations_list = notice_data.get("violations")
        if violations_list and len(violations_list) > 0:
            v_formatted = "<br/>".join([f"• {str(v)}" for v in violations_list])
            offence_data.append([
                Paragraph("<b>Recorded Label Violations:</b>", body_style),
                Paragraph(v_formatted, body_style)
            ])
        offence_data.append([
            Paragraph("<b>Prescribed Compounding Fee:</b>", body_style),
            Paragraph(f"<b>{notice_data.get('compounding_penalty', '₹ 25,000')}</b> (Subject to compounding under Section 48)", body_style)
        ])
        t_offence = Table(offence_data, colWidths=[2.2 * inch, 5.0 * inch])
        t_offence.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_offence)
        story.append(Spacer(1, 12))

        # 5. Statutory Directives
        directions = notice_data.get("officer_directions", (
            "You are hereby directed to submit a written statement of explanation along with certified specimen copies "
            "of the Principal Display Panel packaging declarations to the undersigned Enforcement Officer within 15 calendar days. "
            "Take notice that failure to furnish satisfactory explanation shall result in prosecution under Section 36 of the "
            "Legal Metrology Act, 2009 or institution of compounding proceedings under Section 48."
        ))

        story.append(Paragraph("<b>2. STATUTORY REQUISITIONS &amp; MANDATORY DIRECTIVE:</b>", body_bold))
        story.append(Paragraph(directions, body_style))
        story.append(Spacer(1, 18))

        # 6. Officer Signature Block
        sig_data = [
            [
                Paragraph("<b>Enforcement Seal:</b><br/><font color='#64748B'>Directorate of Legal Metrology<br/>Government of India</font>", body_style),
                Paragraph(f"<b>Issued By:</b><br/>{officer_name}<br/><font color='#64748B'>Legal Metrology Inspector / Enforcement Officer<br/>Central Enforcement Directorate</font>", body_style)
            ]
        ]
        t_sig = Table(sig_data, colWidths=[3.6 * inch, 3.6 * inch])
        t_sig.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#003366')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_sig)

        doc.build(story)
        return filepath
