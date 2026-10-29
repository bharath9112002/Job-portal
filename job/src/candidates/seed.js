// Starter candidates for first run, so the Candidates section isn't empty.

const created = '2026-09-15T10:00:00.000Z'

let row = 0
const exp = (title, company, startDate, endDate, description = '') => ({
  id: `seed-exp-${row++}`,
  title,
  company,
  startDate,
  endDate: endDate ?? '',
  current: endDate === null,
  description,
})
const edu = (degree, fieldOfStudy, institution, startYear, endYear, grade = '') => ({
  id: `seed-edu-${row++}`,
  degree,
  fieldOfStudy,
  institution,
  startYear,
  endYear,
  grade,
})

export function seedCandidates() {
  return [
    {
      id: 1,
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      mobile: '+91 98450 12345',
      address: { line: '12, 4th Cross, Indiranagar', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038' },
      skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Power BI'],
      experience: [
        exp('Data Analyst', 'Freshworks', '2023-07', null, 'Build sales and retention dashboards; automate weekly reporting with Python.'),
        exp('Junior Analyst', 'Mu Sigma', '2021-06', '2023-06'),
      ],
      education: [edu('B.Sc', 'Statistics', 'Christ University', '2018', '2021', '8.4 CGPA')],
      resume: { name: 'Priya_Sharma_Resume.pdf', size: 184320, addedAt: created },
      photo: '',
      createdAt: created,
      updatedAt: created,
    },
    {
      id: 2,
      fullName: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      mobile: '+91 99876 54321',
      address: { line: 'B-702, Lake Homes, Powai', city: 'Mumbai', state: 'Maharashtra', postalCode: '400076' },
      skills: ['Agile', 'Leadership', 'Communication', 'UX Research'],
      experience: [
        exp('Product Manager', 'Razorpay', '2022-04', null, 'Own the merchant onboarding funnel; cut drop-off by 18%.'),
        exp('Associate Product Manager', 'Zeta', '2020-01', '2022-03'),
        exp('Business Analyst', 'Deloitte', '2018-07', '2019-12'),
      ],
      education: [
        edu('MBA', 'Marketing', 'IIM Indore', '2016', '2018'),
        edu('B.Tech', 'Mechanical Engineering', 'VIT Vellore', '2012', '2016', '8.1 CGPA'),
      ],
      resume: { name: 'Arjun_Mehta_PM.pdf', size: 241664, addedAt: created },
      photo: '',
      createdAt: created,
      updatedAt: created,
    },
    {
      id: 3,
      fullName: 'Kavya Iyer',
      email: 'kavya.iyer@example.com',
      mobile: '9840011223',
      address: { line: '45, TTK Road, Alwarpet', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600018' },
      skills: ['Node.js', 'TypeScript', 'AWS', 'Docker', 'REST APIs'],
      experience: [
        exp('Backend Engineer', 'Zoho', '2022-08', null, 'Design and scale APIs for Zoho Desk; on-call for core services.'),
        exp('Software Engineer Intern', 'Chargebee', '2022-01', '2022-06'),
      ],
      education: [edu('B.E.', 'Computer Science', 'Anna University', '2018', '2022', '8.9 CGPA')],
      resume: null,
      photo: '',
      createdAt: created,
      updatedAt: created,
    },
    {
      id: 4,
      fullName: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      mobile: '+91 98111 22334',
      address: { line: 'C-18, Sector 62', city: 'Noida', state: 'Uttar Pradesh', postalCode: '201309' },
      skills: ['React', 'JavaScript', 'TypeScript', 'GraphQL', 'Git'],
      experience: [
        exp('Senior Frontend Developer', 'Paytm', '2021-03', null),
        exp('Frontend Developer', 'Naukri.com', '2018-06', '2021-02'),
      ],
      education: [edu('B.Tech', 'Information Technology', 'Delhi Technological University', '2014', '2018', '7.8 CGPA')],
      resume: { name: 'Rahul_Verma_Frontend.docx', size: 98304, addedAt: created },
      photo: '',
      createdAt: created,
      updatedAt: created,
    },
    {
      id: 5,
      fullName: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      mobile: '9000123456',
      address: { line: 'Plot 21, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500033' },
      skills: ['Figma', 'UI Design', 'UX Research'],
      experience: [exp('Product Designer', 'Swiggy', '2023-01', null, 'Design ordering and checkout flows for the consumer app.')],
      education: [edu('B.Des', 'Interaction Design', 'NID Ahmedabad', '2018', '2022')],
      resume: { name: 'Sneha_Reddy_Portfolio.pdf', size: 1572864, addedAt: created },
      photo: '',
      createdAt: created,
      updatedAt: created,
    },
    {
      id: 6,
      fullName: 'Mohammed Faizal',
      email: 'faizal.m@example.com',
      mobile: '+91 94470 98765',
      address: { line: 'TC 25/1120, Vazhuthacaud', city: 'Thiruvananthapuram', state: 'Kerala', postalCode: '695014' },
      skills: ['Content Writing', 'SEO', 'Communication'],
      experience: [],
      education: [edu('B.A.', 'English Literature', 'University of Kerala', '2022', '2025', 'First Class')],
      resume: null,
      photo: '',
      createdAt: created,
      updatedAt: created,
    },
  ]
}
