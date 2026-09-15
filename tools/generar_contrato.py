#!/usr/bin/env python3
"""Genera el contrato de venta de licencia de software y soporte técnico en PDF.

Editar los datos en la sección DATOS y ejecutar:
  python3 generar_contrato.py
"""

import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# DATOS (editar aquí)
# ---------------------------------------------------------------------------
FECHA = date.today().isoformat()
VALOR_LITERAL = "UN MILLÓN DE PESOS MCTE"
VALOR = "$1.000.000 COP"
VALOR_50 = "$500.000 COP"
VENDEDOR_NOMBRE = "LUIS FERNANDO DELGADO ARBOLEDA"
VENDEDOR_DOC = "cédula de ciudadanía No. 98.637.724"
VENDEDOR_DIR = "municipio de Liborina, departamento de Antioquia"
VENDEDOR_CEL = "321 687 8263"
VENDEDOR_MAIL = "todosoporte2018@gmail.com"
SISTEMA = "“ASOCIACIÓN MUTUAL EL ROSARIO LIBORINA”"
PLAZO_ENTREGA = "[_______]"

NOMBRE_SALIDA = f"contrato_venta_{FECHA}.pdf"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")

# ---------------------------------------------------------------------------
# Fuentes
# ---------------------------------------------------------------------------
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DejaVu", os.path.join(FONT_DIR, "DejaVuSans.ttf")))
pdfmetrics.registerFont(
    TTFont("DejaVu-Bold", os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf"))
)

FONT = "DejaVu"
FONT_B = "DejaVu-Bold"

# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
st_title = ParagraphStyle(
    "titulo", fontName=FONT_B, fontSize=13, leading=17, alignment=TA_CENTER, spaceAfter=6
)
st_sub = ParagraphStyle(
    "sub",
    fontName=FONT,
    fontSize=10,
    leading=14,
    alignment=TA_CENTER,
    spaceAfter=14,
)
st_body = ParagraphStyle(
    "cuerpo",
    fontName=FONT,
    fontSize=9.5,
    leading=14,
    alignment=TA_JUSTIFY,
    spaceAfter=7,
)
st_clause = ParagraphStyle(
    "clausula",
    fontName=FONT_B,
    fontSize=9.5,
    leading=13,
    spaceBefore=6,
    spaceAfter=3,
)
st_bullet = ParagraphStyle(
    "item",
    fontName=FONT,
    fontSize=9.5,
    leading=13,
    alignment=TA_JUSTIFY,
    leftIndent=14,
    spaceAfter=4,
)
st_anexo = ParagraphStyle(
    "anexoT",
    fontName=FONT_B,
    fontSize=11,
    leading=15,
    alignment=TA_CENTER,
    spaceAfter=8,
)
st_firma = ParagraphStyle(
    "firma",
    fontName=FONT,
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
)


def clause(num, title, body):
    return [
        Paragraph(f"CLÁUSULA {num}. {title}", st_clause),
        Paragraph(body, st_body),
    ]


def bullet(text):
    return Paragraph(f"• {text}", st_bullet)


# ---------------------------------------------------------------------------
# Contenido
# ---------------------------------------------------------------------------
S = []
S.append(Paragraph("CONTRATO DE VENTA DE LICENCIA DE SOFTWARE", st_title))
S.append(Paragraph("Y SOPORTE TÉCNICO", st_title))
S.append(Paragraph(
    "Entre los suscritos: por una parte, LUIS FERNANDO DELGADO ARBOLEDA, mayor de edad, "
    "identificado con cédula de ciudadanía No. 98.637.724, vecino del municipio de Liborina, "
    "departamento de Antioquia, teléfono celular 321 687 8263, correo electrónico "
    "todosoporte2018@gmail.com, en adelante “EL VENDEDOR”; y por otra parte, "
    "la ASOCIACIÓN MUTUAL EL ROSARIO LIBORINA, con NIT o identificación No. "
    "[__________________], con domicilio en [__________________________________], "
    "representada legalmente por [_____________________________________], en adelante "
    "“EL COMPRADOR”, se ha celebrado el siguiente contrato que se regirá por las siguientes "
    "cláusulas:",
    st_body,
))
S.append(Spacer(1, 6))

S.extend(clause(
    "PRIMERA", "OBJETO.",
    "EL VENDEDOR se obliga a vender y EL COMPRADOR a pagar, la licencia de uso del software "
    f"de escritorio {SISTEMA}, desarrollado para el sistema operativo Windows, el cual permite "
    "gestionar la información de la asociación, incluyendo como mínimo los siguientes módulos: "
    "registro y consulta de asociados; registro y consulta de beneficiarios; registro de pagos "
    "y generación de recibos de pago imprimibles; control de cobertura y asociados morosos; "
    "registro de fallecidos (asociados y beneficiarios); gestión de usuarios con roles; "
    "configuración general; y respaldo (backup) de la base de datos.",
))

S.extend(clause(
    "SEGUNDA", "ENTREGA E INSTALACIÓN.",
    f"El software será entregado mediante su instalación en el equipo del COMPRADOR, dentro de "
    f"los {PLAZO_ENTREGA} días hábiles siguientes a la firma de este contrato. La instalación "
    "queda sujeta a que el equipo del COMPRADOR cumpla con los requisitos mínimos descritos en "
    "el ANEXO A. Si el equipo no cumple con los requisitos mínimos señalados, NO SE PODRÁ "
    "INSTALAR el software, quedando la instalación suspendida hasta tanto EL COMPRADOR suministre "
    "un equipo que cumpla dichos requisitos, sin que esta suspensión genere costo alguno "
    "adicional para EL VENDEDOR.",
))

S.extend(clause(
    "TERCERA", "VALOR Y FORMA DE PAGO.",
    f"El valor total del presente contrato es de {VALOR} ({VALOR_LITERAL}), que EL COMPRADOR "
    "pagará de contado al momento de la instalación y activación de la licencia en el equipo "
    "del COMPRADOR.",
))

S.extend(clause(
    "CUARTA", "LICENCIA.",
    "EL VENDEDOR otorga a EL COMPRADOR una licencia de uso del software, por un (1) equipo de "
    "cómputo (una máquina por licencia), intransferible y de carácter indefinido, previa "
    "activación mediante el “código de equipo” asociado a la máquina y la clave de activación "
    "entregada por EL VENDEDOR. Esta licencia NO comprende la transferencia del código fuente, "
    "ni de ningún derecho de propiedad intelectual sobre el software, los cuales permanecen "
    "en cabeza exclusiva de EL VENDEDOR.",
))

S.extend(clause(
    "QUINTA", "SOPORTE TÉCNICO.",
    "EL VENDEDOR prestará soporte técnico por un término de SEIS (6) MESES, contados a partir "
    "de la fecha de instalación del software, cuyo alcance es únicamente el FUNCIONAMIENTO DEL "
    "PROGRAMA, es decir: la corrección de errores del software, la atención de dudas de "
    "operación y la reinstalación del programa cuando el equipo haya sido reinstalado. Quedan "
    "expresamente excluidos del soporte: la pérdida o corrupción de datos ocasionada por causas "
    "ajenas al software, los daños producidos por virus o apagones, la manipulación del programa "
    "por terceros no autorizados, los cambios o actualización del hardware o del sistema "
    "operativo, la capacitación extendida de personal y cualquier desarrollo o funcionalidad "
    "nuevos.",
))

S.extend(clause(
    "SEXTA", "DESARROLLOS NUEVOS.",
    f"Cualquier funcionalidad nueva o módulo adicional que EL COMPRADOR solicite y que no se "
    "encuentre contemplado en la cláusula primera, será cotizado y contratado por separado, y "
    f"tendrá un valor equivalente al CINCUENTA POR CIENTO (50%) del valor de este contrato "
    f"({VALOR_50}) por cada desarrollo, independientemente del alcance del mismo.",
))

S.extend(clause(
    "SÉPTIMA", "GARANTÍA.",
    "EL VENDEDOR garantiza el correcto funcionamiento del software por el término de treinta "
    "(30) días contados desde la instalación, cubriendo únicamente defectos de instalación y "
    "errores de funcionamiento del propio software.",
))

S.extend(clause(
    "OCTAVA", "PROTECCIÓN DE DATOS.",
    "Los datos personales que EL COMPRADOR registre en el software son de su exclusiva "
    "responsabilidad, conforme a lo dispuesto en la Ley 1581 de 2012 y demás normas "
    "concordantes. EL VENDEDOR no accede, almacena ni trata dichos datos.",
))

S.extend(clause(
    "NOVENA", "TERMINACIÓN Y VIGENCIA.",
    "El soporte técnico terminará al vencerse los seis (6) meses señalados en la cláusula "
    "quinta. La licencia de uso se mantendrá vigente mientras subsista el equipo en el cual fue "
    "activada, sin obligaciones de pago periódicas para EL COMPRADOR.",
))

S.extend(clause(
    "DÉCIMA", "CLÁUSULAS GENERALES.",
    "Las modificaciones a este contrato solo tendrán validez si constan por escrito y con la "
    "firma de ambas partes. Este contrato se regirá por las leyes de la República de Colombia y "
    "las partes acuerdan someter las controversias que surjan de su ejecución a los jueces del "
    "municipio de Liborina, Antioquia.",
))

S.append(Spacer(1, 10))

# Firmas
S.append(Paragraph("Para constancia se firma en Liborina, Antioquia, a los [___] días del mes "
                   "de ____________________ de 20____.", st_body))
S.append(Spacer(1, 26))

tbl = Table(
    [
        [
            Paragraph("_______________________________", st_firma),
            Paragraph("_______________________________", st_firma),
        ],
        [
            Paragraph(f"<b>{VENDEDOR_NOMBRE}</b>", st_firma),
            Paragraph("EL COMPRADOR", st_firma),
        ],
        [
            Paragraph("EL VENDEDOR", st_firma),
            Paragraph("Identificación / NIT: ________________", st_firma),
        ],
        [
            Paragraph("C.C. 98.637.724", st_firma),
            Paragraph("Representante legal: _________________", st_firma),
        ],
        [
            Paragraph("Celular: 321 687 8263", st_firma),
            Paragraph("Firma autorizada: ____________________", st_firma),
        ],
    ],
    colWidths=[90 * mm, 90 * mm],
)
tbl.setStyle(TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
]))
S.append(tbl)

S.append(Spacer(1, 16))

# Anexo A
S.append(Paragraph("ANEXO A — REQUISITOS MÍNIMOS DEL EQUIPO", st_anexo))
reqs = [
    ["Componente", "Requisito mínimo"],
    ["Sistema operativo", "Windows 10 u 11, de 64 bits (x64)"],
    ["Procesador", "Procesador x64 (64 bits), mínimo 2.0 GHz"],
    ["Memoria RAM", "Mínimo 4 GB"],
    ["Disco duro", "Mínimo 1 GB de espacio libre"],
    ["WebView2 Runtime", "Incluido por defecto en Windows 10/11; si faltase, se instala "
     "automáticamente durante la instalación del software"],
    ["Impresora", "Impresora funcional para la impresión de recibos de pago"],
    ["Internet", "No es obligatorio para operar; se utiliza únicamente para consultar "
     "actualizaciones del programa"],
]
req_tbl = Table(reqs, colWidths=[45 * mm, 135 * mm], repeatRows=1)
req_tbl.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (-1, 0), FONT_B),
    ("FONTNAME", (0, 1), (-1, -1), FONT),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.92, 0.92, 0.92)),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
S.append(req_tbl)
S.append(Spacer(1, 8))
S.append(Paragraph(
    "Se deja constancia de que si el equipo no cumple con los requisitos mínimos anteriores, "
    "el software no podrá ser instalado, conforme a lo establecido en la cláusula segunda de "
    "este contrato.", st_body,
))

# ---------------------------------------------------------------------------
# Documento
# ---------------------------------------------------------------------------
os.makedirs(OUTPUT_DIR, exist_ok=True)
output_path = os.path.join(OUTPUT_DIR, NOMBRE_SALIDA)

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    rightMargin=22 * mm,
    leftMargin=22 * mm,
    topMargin=20 * mm,
    bottomMargin=20 * mm,
    title=f"Contrato de venta de licencia - {SISTEMA}",
    author=VENDEDOR_NOMBRE,
)

doc.build(S)
print(f"PDF generado: {os.path.abspath(output_path)}")