import type { CvContent } from "@/lib/cv-schema";

/** Demo content for template previews on the landing page and in tests. */
export const SAMPLE_CV: CvContent = {
  labels: {
    profile: "Profile",
    experience: "Experience",
    education: "Education",
    certifications: "Certifications",
    skills: "Skills",
    languages: "Languages",
    projects: "Projects",
    contact: "Contact",
  },
  basics: {
    fullName: "Sara El Amrani",
    headline: "Data Analyst",
    email: "sara.elamrani@email.com",
    phone: "+212 6 12 34 56 78",
    location: "Casablanca, Morocco",
    website: "",
    linkedin: "linkedin.com/in/saraelamrani",
    summary:
      "Data analyst with 4 years of experience turning sales and operations data into decisions for retail and logistics teams. Built the reporting suite that cut monthly close from 6 days to 2, and a churn model that recovered 1.2M MAD in annual revenue. Brings strong SQL, Python and Power BI skills and a habit of explaining numbers in plain language.",
  },
  experience: [
    {
      role: "Data Analyst",
      company: "Marjane Group",
      location: "Casablanca",
      start: "Jan 2022",
      end: "Present",
      bullets: [
        "Built 14 Power BI dashboards used weekly by 60+ store managers, replacing manual Excel reports.",
        "Automated the monthly sales close with SQL and Python, cutting it from 6 days to 2.",
        "Designed a customer churn model that flagged at-risk accounts and recovered 1.2M MAD a year.",
      ],
    },
    {
      role: "Junior Business Analyst",
      company: "CTM Logistics",
      location: "Rabat",
      start: "Jul 2020",
      end: "Dec 2021",
      bullets: [
        "Analysed delivery data for 300 routes and proposed changes that reduced fuel cost by 8%.",
        "Ran stakeholder workshops to define KPIs for the operations team.",
      ],
    },
  ],
  education: [
    {
      degree: "Master's degree",
      field: "Business Intelligence",
      institution: "ENCG Casablanca",
      location: "Casablanca",
      start: "2018",
      end: "2020",
      details: ["Graduated with honours (Mention Bien)", "Thesis: demand forecasting for retail"],
    },
  ],
  certifications: [
    { name: "Microsoft Certified: Power BI Data Analyst", issuer: "Microsoft", date: "2023", credentialId: "" },
    { name: "Google Data Analytics", issuer: "Coursera", date: "2021", credentialId: "" },
  ],
  skills: [
    { category: "Analytics", items: ["SQL", "Python (pandas)", "Power BI", "Excel", "A/B testing"] },
    { category: "Business", items: ["KPI design", "Forecasting", "Stakeholder reporting"] },
  ],
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "French", level: "Fluent" },
    { name: "English", level: "Professional" },
  ],
  projects: [
    { name: "Retail demand forecaster", description: "Open-source Python tool forecasting weekly demand per store.", link: "github.com/sara/forecast" },
  ],
};
