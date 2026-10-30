// Starter applications linking the sample candidates (Module 6) to the sample jobs (Module 4).

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString()

const SEEDS = [
  // [candidateId, name, email, jobId, title, companyId, company, statuses as [status, daysAgo, note]]
  [1, 'Priya Sharma', 'priya.sharma@example.com', 3, 'Data Analyst', 3, 'Schiller - Zieme',
    [['applied', 9, ''], ['review', 7, ''], ['shortlisted', 4, 'Strong SQL and Tableau portfolio.']]],
  [3, 'Kavya Iyer', 'kavya.iyer@example.com', 5, 'Backend Engineer (Node.js)', 5, 'Graham - Gulgowski',
    [['applied', 8, ''], ['review', 6, ''], ['shortlisted', 5, ''], ['interview', 2, 'Technical round scheduled for Friday.']]],
  [4, 'Rahul Verma', 'rahul.verma@example.com', 1, 'Senior React Developer', 1, 'Dooley, Kozey and Cronin',
    [['applied', 3, ''], ['review', 1, '']]],
  [5, 'Sneha Reddy', 'sneha.reddy@example.com', 4, 'Product Designer', 4, 'Pagac and Sons',
    [['applied', 2, '']]],
  [2, 'Arjun Mehta', 'arjun.mehta@example.com', 12, 'Product Manager', 12, 'Miller, Schowalter and Wisozk',
    [['applied', 14, ''], ['review', 12, ''], ['interview', 8, ''], ['offered', 1, 'Offer sent — awaiting response.']]],
  [6, 'Mohammed Faizal', 'faizal.m@example.com', 6, 'Marketing Intern', 6, 'Pfannerstill Inc',
    [['applied', 1, '']]],
  [1, 'Priya Sharma', 'priya.sharma@example.com', 11, 'Machine Learning Engineer', 11, 'Considine - Torp',
    [['applied', 6, ''], ['review', 5, ''], ['rejected', 3, 'Looking for more production ML experience.']]],
  [4, 'Rahul Verma', 'rahul.verma@example.com', 16, 'Java Developer', 1, 'Dooley, Kozey and Cronin',
    [['applied', 30, ''], ['withdrawn', 25, 'Withdrawn by candidate.']]],
]

export function seedApplications() {
  return SEEDS.map(([candidateId, candidateName, candidateEmail, jobId, jobTitle, companyId, companyName, steps], i) => {
    const history = steps.map(([status, d, note]) => ({ status, at: daysAgo(d), note }))
    return {
      id: i + 1,
      jobId,
      jobTitle,
      companyId,
      companyName,
      candidateId,
      candidateName,
      candidateEmail,
      coverLetter: '',
      status: history.at(-1).status,
      appliedAt: history[0].at,
      updatedAt: history.at(-1).at,
      history,
    }
  })
}
