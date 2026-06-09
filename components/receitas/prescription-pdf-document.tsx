import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export const OPTIC_BRAND_NAME = "El Shaday Ótica";

export type PrescriptionPdfPayload = {
  prescriptionId: string;
  issuedAt: string;
  patientName: string;
  patientCpf: string | null;
  patientPhone: string | null;
  doctorName: string;
  odSphere: string | null;
  odCylinder: string | null;
  odAxis: number | null;
  odAddition: string | null;
  odDnp: string | null;
  osSphere: string | null;
  osCylinder: string | null;
  osAxis: number | null;
  osAddition: string | null;
  osDnp: string | null;
  lensType: string | null;
  notes: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 10,
    marginBottom: 18,
  },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0369a1" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 4 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 8,
    color: "#0f172a",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    alignItems: "center",
  },
  headerRow: { backgroundColor: "#f1f5f9" },
  cellLabel: { width: "28%", fontFamily: "Helvetica-Bold", color: "#334155", fontSize: 9 },
  cellOd: { width: "36%", paddingLeft: 8, fontSize: 10 },
  cellOs: { width: "36%", paddingLeft: 8, fontSize: 10 },
  footer: { marginTop: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#cbd5e1" },
  footText: { fontSize: 9, color: "#64748b" },
  notesBlock: { marginTop: 8 },
  notesTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4, fontSize: 10 },
  notesBody: { lineHeight: 1.5, fontSize: 10 },
  fullRow: { flexDirection: "row", paddingVertical: 6 },
});

function dash(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

type Props = { data: PrescriptionPdfPayload };

export function PrescriptionPdfDocument({ data }: Props): ReactElement {
  const issued = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(data.issuedAt));

  const rows: [string, string | number | null, string | number | null][] = [
    ["Esférico", data.odSphere, data.osSphere],
    ["Cilíndrico", data.odCylinder, data.osCylinder],
    ["Eixo (°)", data.odAxis, data.osAxis],
    ["Adição", data.odAddition, data.osAddition],
    ["DNP (mm)", data.odDnp, data.osDnp],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{OPTIC_BRAND_NAME}</Text>
          <Text style={styles.subtitle}>
            Receita oftalmológica para correção visual · Uso sob orientação profissional
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Dados do paciente</Text>
        <View style={styles.row}>
          <Text style={{ flex: 1, fontSize: 10 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Nome: </Text>
            {data.patientName}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={{ width: "50%", fontSize: 10 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>CPF: </Text>
            {dash(data.patientCpf)}
          </Text>
          <Text style={{ width: "50%", fontSize: 10 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Telefone: </Text>
            {dash(data.patientPhone)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Prescrição</Text>
        <View style={[styles.row, styles.headerRow]} wrap={false}>
          <Text style={styles.cellLabel}>Campo</Text>
          <Text style={[styles.cellOd, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>OD</Text>
          <Text style={[styles.cellOs, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>OE</Text>
        </View>
        {rows.map(([label, od, os]) => (
          <View key={label} style={styles.row} wrap={false}>
            <Text style={styles.cellLabel}>{label}</Text>
            <Text style={styles.cellOd}>{dash(od)}</Text>
            <Text style={styles.cellOs}>{dash(os)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Outros</Text>
        <View style={styles.fullRow} wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold", width: 100, fontSize: 10 }}>Tipo de lente</Text>
          <Text style={{ flex: 1, fontSize: 10 }}>{dash(data.lensType)}</Text>
        </View>
        {data.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesTitle}>Observações</Text>
            <Text style={styles.notesBody}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer} wrap={false}>
          <Text style={styles.footText}>Data de emissão: {issued}</Text>
          <Text style={[styles.footText, { marginTop: 6 }]}>
            Médico(a) responsável: {data.doctorName}
          </Text>
          <Text style={[styles.footText, { marginTop: 4, fontSize: 8 }]}>
            Referência da receita: {data.prescriptionId}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
