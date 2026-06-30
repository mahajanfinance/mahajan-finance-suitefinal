var fs = require('fs');
var o = [];
function w() { for (var i = 0; i < arguments.length; i++) o.push(arguments[i]); }
var F = 'D:\\mahajan-finance-suite-main cashflow added\\src\\pages\\AccountingServices.tsx';

w('"use client";');
w('');
w('import React, { useState, useCallback } from "react";');
w("import { uploadDocsToStorage } from '@/utils/uploadDocs';");
w('import { motion, AnimatePresence } from "framer-motion";');
w('import { toast } from "sonner";');
w('import { supabase } from "@/integrations/supabase/client";');
w('import { Send, Upload, ChevronDown, ChevronUp, FileText, CheckCircle2, Circle, Info, Clock, IndianRupee, CalendarDays, ShieldCheck, Building2, Landmark, Users, Leaf, HandHelping, Briefcase, X } from "lucide-react";');
w('import type { ReactNode } from "react";');
w('');
w('interface ServiceField { label: string; key: string; type?: string; required?: boolean; hint?: string; options?: string[]; }');
w('interface ServiceDoc { name: string; optional?: boolean; }');
w('interface ServiceBadge { label: string; variant: string; }');
w('interface AccountingService { key: string; title: string; icon: any; description: string; timeline: string; price: string; fields: ServiceField[]; docs: ServiceDoc[]; badges: ServiceBadge[]; }');
w('');
w('const InfoBox = ({ children }: { children: ReactNode }) => (');
w('  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0" /><span>{children}</span></div>');
w(');');
w('');
w('const Badge = ({ variant = "default", children }: { variant?: string; children: ReactNode }) => {');
w('  var c: Record<string,string> = { default: "bg-primary/10 text-primary border-primary/20", secondary: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", outline: "bg-muted text-muted-foreground border-border" };');
w('  return <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border " + (c[variant]||c.default)}>{children}</span>;');
w('};');
w('');
w('const DocumentUpload = ({ docName, onFile, file }: { docName: string; onFile: (f: File | null) => void; file?: File | null }) => {');
w('  var id = "doc-" + docName.replace(/\\s+/g, "-");');
w('  return (');
w('    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">');
w('      <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />');
w('      <label htmlFor={id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"><Upload size={14} /> Upload</label>');
w('      <span className="text-sm text-muted-foreground truncate">{file ? file.name : "No file selected"}</span>');
w('      {file && <button type="button" onClick={() => onFile(null)} className="ml-auto text-destructive hover:text-destructive/80"><X size={14} /></button>}');
w('    </div>');
w('  );');
w('};');

var svcs = [
  { key:'gst-returns', title:'GST Returns Filing', icon:'Landmark', description:'Complete GST return filing including GSTR-1, GSTR-3B with expert review and compliance check.', timeline:'3-5 working days', price:'From \u20B9999/month',
    fields:[{label:'Business Name',key:'business_name',required:true},{label:'GSTIN',key:'gstin',hint:'15-digit GSTIN'},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'Return Period',key:'return_period',type:'select',options:['Monthly','Quarterly'],required:true},{label:'City',key:'city'}],
    docs:['Sales Register','Purchase Register','Bank Statement'],
    badges:[{label:'GSTR-1',variant:'default'},{label:'GSTR-3B',variant:'default'},{label:'ITC Reconciliation',variant:'secondary'}] },
  { key:'itr-filing', title:'ITR Filing', icon:'IndianRupee', description:'Expert income tax return filing for individuals and businesses with maximum refund optimization.', timeline:'2-3 working days', price:'From \u20B9999',
    fields:[{label:'Full Name',key:'name',required:true},{label:'PAN',key:'pan',hint:'10-digit PAN',required:true},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'Income Type',key:'income_type',type:'select',options:['Salaried','Business','Professional','Capital Gains','House Property','Other Sources'],required:true},{label:'Assessment Year',key:'assessment_year',type:'select',options:['2025-26','2026-27'],required:true},{label:'City',key:'city'}],
    docs:['Form 16 / 16A','Bank Statements (All accounts)','Investment Proofs (80C, 80D etc.)','Capital Gains Statement (if applicable)'],
    badges:[{label:'ITR-1 to ITR-7',variant:'default'},{label:'Max Refund',variant:'secondary'}] },
  { key:'company-registration', title:'Company Registration', icon:'Building2', description:'Complete Private Limited Company registration with MCA, PAN, TAN and all compliance documents.', timeline:'7-10 working days', price:'From \u20B97,999',
    fields:[{label:'Full Name',key:'name',required:true},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'Company Name',key:'company_name',required:true},{label:'Company Type',key:'company_type',type:'select',options:['Private Limited','One Person Company (OPC)','Section 8 Company'],required:true},{label:'State',key:'state',required:true},{label:'Authorized Capital',key:'authorized_capital',hint:'Minimum \u20B91,00,000'}],
    docs:['ID Proof of Directors','Address Proof of Registered Office','Passport Size Photos','NO objection from Property Owner'],
    badges:[{label:'MCA Approved',variant:'default'},{label:'PAN + TAN',variant:'secondary'},{label:'CIN Allotted',variant:'outline'}] },
  { key:'llp-registration', title:'LLP Registration', icon:'Briefcase', description:'Limited Liability Partnership registration with MCA including DPIN, DSC and LLP agreement drafting.', timeline:'7-12 working days', price:'From \u20B95,999',
    fields:[{label:'Full Name',key:'name',required:true},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'LLP Name',key:'llp_name',required:true},{label:'Business Activity',key:'business_activity',required:true},{label:'State',key:'state',required:true},{label:'Number of Partners',key:'num_partners',type:'select',options:['2','3','4','5+']}],
    docs:['ID Proof of Partners','Address Proof of Registered Office','Passport Size Photos','Partnership Deed (if converting)'],
    badges:[{label:'MCA Approved',variant:'default'},{label:'Limited Liability',variant:'secondary'}] },
  { key:'fpc-registration', title:'FPC Registration', icon:'Leaf', description:'Farmer Producer Company registration under Companies Act with NABARD subsidy guidance.', timeline:'10-15 working days', price:'From \u20B912,999',
    fields:[{label:'Full Name',key:'name',required:true},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'FPC Name',key:'fpc_name',required:true},{label:'Village/Taluka',key:'village',required:true},{label:'District',key:'district',required:true},{label:'State',key:'state',required:true},{label:'Farmer Members',key:'num_members',type:'select',options:['10-50','50-100','100-500','500+']}],
    docs:['ID Proof of Directors','Address Proof','Passport Size Photos','List of Farmer Members with Aadhaar'],
    badges:[{label:'Companies Act',variant:'default'},{label:'NABARD',variant:'secondary'},{label:'Tax Benefits',variant:'outline'}] },
  { key:'trust-registration', title:'Trust Registration', icon:'HandHelping', description:'Public/Private Trust registration with Trust Deed drafting, PAN, and 12A/80G registration assistance.', timeline:'10-15 working days', price:'From \u20B94,999',
    fields:[{label:'Full Name',key:'name',required:true},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'Trust Name',key:'trust_name',required:true},{label:'Trust Type',key:'trust_type',type:'select',options:['Public Trust','Private Trust','Religious Trust','Educational Trust'],required:true},{label:'Objectives',key:'objectives',type:'textarea'},{label:'State',key:'state',required:true}],
    docs:['ID Proof of Trustees','Address Proof','Passport Size Photos','Trust Deed Draft (if available)'],
    badges:[{label:'Trust Deed',variant:'default'},{label:'12A & 80G',variant:'secondary'}] },
  { key:'project-reports', title:'Project Reports', icon:'FileText', description:'Detailed project reports for bank loans, subsidy schemes (PMEGP, MUDRA, AVM) with financial projections.', timeline:'5-7 working days', price:'From \u20B92,999',
    fields:[{label:'Full Name',key:'name',required:true},{label:'Mobile Number',key:'mobile',type:'tel',required:true},{label:'Email',key:'email',type:'email'},{label:'Project/Business Name',key:'project_name',required:true},{label:'Loan Amount',key:'loan_amount',hint:'e.g., 5,00,000'},{label:'Purpose',key:'purpose',type:'select',options:['Business Loan','Machinery Loan','Working Capital','PMEGP Subsidy','MUDRA Loan','AVM Scheme','Agriculture','Other'],required:true},{label:'State',key:'state',required:true}],
    docs:['ID Proof','Address Proof','Machinery Quotations','Land/Shop Documents','Rent Agreement (if rented)'],
    badges:[{label:'Bank Ready',variant:'default'},{label:'Subsidy Schemes',variant:'secondary'},{label:'CMA Data',variant:'outline'}] },
];

w('');
w('const accountingServices: AccountingService[] = [');
svcs.forEach(function(s, i) {
  w('  { key: "' + s.key + '", title: "' + s.title + '", icon: ' + s.icon + ', description: "' + s.description + '", timeline: "' + s.timeline + '", price: "' + s.price + '",');
  w('    fields: [');
  s.fields.forEach(function(f) {
    var fl = '      { label: "' + f.label + '", key: "' + f.key + '"';
    if (f.type) fl += ', type: "' + f.type + '"';
    if (f.required) fl += ', required: true';
    if (f.hint) fl += ', hint: "' + f.hint + '"';
    if (f.options) fl += ', options: [' + f.options.map(function(o){return '"' + o + '"'}).join(', ') + ']';
    fl += ' },';
    w(fl);
  });
  w('    ], docs: [' + s.docs.map(function(d){return '{ name: "' + d + '" }'}).join(', ') + '],');
  w('    badges: [' + s.badges.map(function(b){return '{ label: "' + b.label + '", variant: "' + b.variant + '" }'}).join(', ') + ']');
  w('  }' + (i < svcs.length - 1 ? ',' : ''));
});
w('];');

fs.writeFileSync(F, o.join('\n'), 'utf8');
console.log('Part 1 done: ' + o.length + ' lines');
