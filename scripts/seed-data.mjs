import { drizzle } from "drizzle-orm/mysql2";
import { universities, professors, researchProjects } from "../drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seedData() {
  console.log("Starting data seeding...");

  // Seed Universities
  const universityData = [
    { name: "Stanford University", country: "USA", ranking: 3, website: "https://www.stanford.edu", description: "A leading research university in Silicon Valley" },
    { name: "MIT", country: "USA", ranking: 1, website: "https://www.mit.edu", description: "Massachusetts Institute of Technology, renowned for STEM programs" },
    { name: "Harvard University", country: "USA", ranking: 2, website: "https://www.harvard.edu", description: "Ivy League research university with extensive research programs" },
    { name: "UC Berkeley", country: "USA", ranking: 4, website: "https://www.berkeley.edu", description: "Public research university with strong science and engineering programs" },
    { name: "Oxford University", country: "UK", ranking: 5, website: "https://www.ox.ac.uk", description: "One of the world's oldest and most prestigious universities" },
    { name: "Cambridge University", country: "UK", ranking: 6, website: "https://www.cam.ac.uk", description: "Historic university with cutting-edge research facilities" },
    { name: "ETH Zurich", country: "Switzerland", ranking: 7, website: "https://ethz.ch", description: "Leading European university for science and technology" },
    { name: "University of Tokyo", country: "Japan", ranking: 23, website: "https://www.u-tokyo.ac.jp", description: "Japan's top research university" },
  ];

  console.log("Seeding universities...");
  for (const uni of universityData) {
    await db.insert(universities).values(uni);
  }

  // Get inserted universities
  const insertedUniversities = await db.select().from(universities);
  console.log(`Seeded ${insertedUniversities.length} universities`);

  // Seed Professors
  const professorData = [
    {
      universityId: insertedUniversities.find(u => u.name === "Stanford University")?.id || 1,
      name: "Dr. Andrew Ng",
      email: "ang@stanford.edu",
      department: "Computer Science",
      title: "Professor",
      researchAreas: JSON.stringify(["Machine Learning", "Artificial Intelligence", "Deep Learning"]),
      labName: "Stanford AI Lab",
      labWebsite: "https://ai.stanford.edu",
      bio: "Pioneer in machine learning and AI education",
      acceptingStudents: true,
    },
    {
      universityId: insertedUniversities.find(u => u.name === "MIT")?.id || 2,
      name: "Dr. Regina Barzilay",
      email: "regina@mit.edu",
      department: "Electrical Engineering and Computer Science",
      title: "Professor",
      researchAreas: JSON.stringify(["Natural Language Processing", "Machine Learning", "Healthcare AI"]),
      labName: "MIT CSAIL",
      labWebsite: "https://www.csail.mit.edu",
      bio: "MacArthur Fellow working on AI for healthcare",
      acceptingStudents: true,
    },
    {
      universityId: insertedUniversities.find(u => u.name === "UC Berkeley")?.id || 4,
      name: "Dr. Pieter Abbeel",
      email: "pabbeel@berkeley.edu",
      department: "Electrical Engineering and Computer Science",
      title: "Professor",
      researchAreas: JSON.stringify(["Robotics", "Reinforcement Learning", "AI"]),
      labName: "Berkeley AI Research Lab",
      labWebsite: "https://bair.berkeley.edu",
      bio: "Leading researcher in robotics and deep reinforcement learning",
      acceptingStudents: true,
    },
    {
      universityId: insertedUniversities.find(u => u.name === "Oxford University")?.id || 5,
      name: "Dr. Michael Wooldridge",
      email: "michael.wooldridge@cs.ox.ac.uk",
      department: "Computer Science",
      title: "Professor",
      researchAreas: JSON.stringify(["Multi-Agent Systems", "AI", "Game Theory"]),
      labName: "Oxford AI Lab",
      labWebsite: "https://www.cs.ox.ac.uk",
      bio: "Expert in multi-agent systems and artificial intelligence",
      acceptingStudents: true,
    },
    {
      universityId: insertedUniversities.find(u => u.name === "Stanford University")?.id || 1,
      name: "Dr. Fei-Fei Li",
      email: "feifeili@stanford.edu",
      department: "Computer Science",
      title: "Professor",
      researchAreas: JSON.stringify(["Computer Vision", "AI", "Cognitive Neuroscience"]),
      labName: "Stanford Vision and Learning Lab",
      labWebsite: "https://svl.stanford.edu",
      bio: "Pioneer in computer vision and AI for social good",
      acceptingStudents: true,
    },
  ];

  console.log("Seeding professors...");
  for (const prof of professorData) {
    await db.insert(professors).values(prof);
  }

  const insertedProfessors = await db.select().from(professors);
  console.log(`Seeded ${insertedProfessors.length} professors`);

  // Seed Research Projects
  const projectData = [
    {
      professorId: insertedProfessors.find(p => p.name === "Dr. Andrew Ng")?.id || 1,
      universityId: insertedUniversities.find(u => u.name === "Stanford University")?.id || 1,
      title: "Deep Learning for Medical Diagnosis",
      description: "Developing deep learning models to assist in medical image analysis and disease diagnosis. Students will work on state-of-the-art computer vision techniques applied to healthcare.",
      requirements: JSON.stringify(["Python programming", "Machine learning basics", "Interest in healthcare applications"]),
      researchAreas: JSON.stringify(["Machine Learning", "Computer Vision", "Healthcare"]),
      majors: JSON.stringify(["Computer Science", "Biomedical Engineering", "Data Science"]),
      duration: "3-6 months",
      isPaid: false,
      isRemote: false,
      status: "open",
    },
    {
      professorId: insertedProfessors.find(p => p.name === "Dr. Regina Barzilay")?.id || 2,
      universityId: insertedUniversities.find(u => u.name === "MIT")?.id || 2,
      title: "Natural Language Processing for Clinical Text",
      description: "Research project focusing on extracting insights from electronic health records using NLP techniques. Ideal for students interested in the intersection of AI and medicine.",
      requirements: JSON.stringify(["Strong programming skills", "NLP background", "Statistical analysis"]),
      researchAreas: JSON.stringify(["Natural Language Processing", "Healthcare AI", "Data Mining"]),
      majors: JSON.stringify(["Computer Science", "Computational Biology", "Linguistics"]),
      duration: "6-12 months",
      isPaid: true,
      isRemote: true,
      status: "open",
    },
    {
      professorId: insertedProfessors.find(p => p.name === "Dr. Pieter Abbeel")?.id || 3,
      universityId: insertedUniversities.find(u => u.name === "UC Berkeley")?.id || 4,
      title: "Robotic Manipulation with Deep Reinforcement Learning",
      description: "Cutting-edge research in teaching robots to manipulate objects using deep RL. Students will work with physical robots and simulation environments.",
      requirements: JSON.stringify(["Python/C++", "Machine learning", "Linear algebra", "Interest in robotics"]),
      researchAreas: JSON.stringify(["Robotics", "Reinforcement Learning", "Computer Vision"]),
      majors: JSON.stringify(["Computer Science", "Electrical Engineering", "Mechanical Engineering"]),
      duration: "6 months",
      isPaid: false,
      isRemote: false,
      status: "open",
    },
    {
      professorId: insertedProfessors.find(p => p.name === "Dr. Michael Wooldridge")?.id || 4,
      universityId: insertedUniversities.find(u => u.name === "Oxford University")?.id || 5,
      title: "Multi-Agent Systems for Autonomous Vehicles",
      description: "Research on coordination and decision-making in multi-agent systems, with applications to autonomous vehicle fleets.",
      requirements: JSON.stringify(["Programming experience", "Game theory knowledge", "Interest in autonomous systems"]),
      researchAreas: JSON.stringify(["Multi-Agent Systems", "Game Theory", "Autonomous Systems"]),
      majors: JSON.stringify(["Computer Science", "Mathematics", "Engineering"]),
      duration: "4-8 months",
      isPaid: true,
      isRemote: true,
      status: "open",
    },
    {
      professorId: insertedProfessors.find(p => p.name === "Dr. Fei-Fei Li")?.id || 5,
      universityId: insertedUniversities.find(u => u.name === "Stanford University")?.id || 1,
      title: "Visual Recognition and Scene Understanding",
      description: "Developing algorithms for visual recognition and understanding complex scenes. Project involves working with large-scale image datasets.",
      requirements: JSON.stringify(["Python", "Deep learning frameworks", "Computer vision fundamentals"]),
      researchAreas: JSON.stringify(["Computer Vision", "Deep Learning", "Pattern Recognition"]),
      majors: JSON.stringify(["Computer Science", "Electrical Engineering", "Cognitive Science"]),
      duration: "3-9 months",
      isPaid: false,
      isRemote: false,
      status: "open",
    },
    {
      professorId: insertedProfessors.find(p => p.name === "Dr. Andrew Ng")?.id || 1,
      universityId: insertedUniversities.find(u => u.name === "Stanford University")?.id || 1,
      title: "AI for Climate Change Mitigation",
      description: "Applying machine learning to climate data analysis and renewable energy optimization. Interdisciplinary project combining AI with environmental science.",
      requirements: JSON.stringify(["Machine learning", "Data analysis", "Interest in sustainability"]),
      researchAreas: JSON.stringify(["Machine Learning", "Environmental Science", "Data Science"]),
      majors: JSON.stringify(["Computer Science", "Environmental Engineering", "Data Science"]),
      duration: "6 months",
      isPaid: true,
      isRemote: true,
      status: "open",
    },
  ];

  console.log("Seeding research projects...");
  for (const project of projectData) {
    await db.insert(researchProjects).values(project);
  }

  const insertedProjects = await db.select().from(researchProjects);
  console.log(`Seeded ${insertedProjects.length} research projects`);

  console.log("Data seeding completed successfully!");
  process.exit(0);
}

seedData().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});
