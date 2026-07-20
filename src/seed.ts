import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB, getMongoClientDb } from "./lib/db";
import { createAuth } from "./lib/auth";
import { Paper } from "./models/Paper";

const DEMO_USER = { name: "Demo Student", email: "demo@scholarai.com", password: "Demo1234!" };
const ADMIN_USER = { name: "Admin", email: "admin@scholarai.com", password: "Admin1234!" };

const SAMPLE_PAPERS = [
  {
    title: "Attention Sparsity in Low-Resource Bengali NLP",
    field: "Computer Science",
    authors: ["Jannat Sumaiya"],
    abstract: "This paper evaluates pruning strategies for transformer attention heads when training on limited Bengali text corpora, showing that structured sparsity can retain over 90% of baseline accuracy at half the parameter count.",
    extractedText: "Introduction: Low-resource languages like Bengali suffer from limited training data, making large transformer models prone to overfitting. This study evaluates three pruning strategies — magnitude-based, structured head pruning, and lottery-ticket pruning — on a Bengali news classification task. Methodology: We trained a 6-layer transformer on a 200k-sentence Bengali corpus and applied each pruning method at 25%, 50%, and 75% sparsity. Results: Structured head pruning at 50% sparsity retained 91.2% of baseline F1 score while reducing inference latency by 38%. Magnitude pruning underperformed at higher sparsity levels due to uneven weight distribution in low-resource embeddings. Conclusion: Structured pruning is a practical strategy for deploying Bengali NLP models on resource-constrained devices without major accuracy loss.",
    aiSummary: "The paper compares three pruning methods for shrinking transformer models trained on Bengali text. Structured head pruning at 50% sparsity performs best, keeping most of the model's accuracy while cutting inference time significantly, making it a good option for low-resource deployment.",
    aiKeyPoints: [
      "Structured head pruning retained 91.2% of baseline F1 at 50% sparsity",
      "Inference latency dropped by 38% after pruning",
      "Magnitude pruning underperformed at high sparsity due to uneven weight distribution",
      "Tested on a 200k-sentence Bengali news classification corpus",
    ],
  },
  {
    title: "Remittance Flows and Rural Household Savings in Sylhet",
    field: "Economics",
    authors: ["Jannat Sumaiya", "Md. Rahman"],
    abstract: "A survey-based study of 340 households across Sylhet division examining how remittance income affects savings behavior compared to locally-earned income.",
    extractedText: "This study surveyed 340 households across Sylhet division to compare savings behavior between remittance-receiving and non-receiving households. Households receiving remittances saved on average 18% more of total income than households relying solely on local income sources, controlling for household size and education. However, remittance income was more likely to be directed toward durable goods and housing improvements rather than liquid savings. Regression analysis found that the marginal propensity to save from remittance income was 0.31, compared to 0.22 for locally-earned income. The paper argues that policy interventions encouraging formal savings instruments could improve long-term financial resilience for remittance-receiving households.",
    aiSummary: "Surveying 340 households in Sylhet, this paper finds that families receiving remittances save more overall than those without, but tend to spend it on housing and durable goods rather than liquid savings. Remittance income has a higher marginal propensity to save than local income.",
    aiKeyPoints: [
      "Remittance-receiving households saved 18% more of total income on average",
      "Marginal propensity to save from remittances: 0.31 vs 0.22 for local income",
      "Remittance income skews toward durable goods and housing over liquid savings",
      "Survey covered 340 households across Sylhet division",
    ],
  },
  {
    title: "Antibiotic Resistance Patterns in Urban Wastewater",
    field: "Biology",
    authors: ["Farah Ahmed"],
    abstract: "This study analyzes antibiotic-resistant bacteria concentrations in wastewater samples from three urban treatment facilities over a six-month period.",
    extractedText: "Wastewater samples were collected weekly from three treatment facilities over six months and screened for resistance to five common antibiotic classes. Resistance to macrolides was detected in 64% of samples, the highest of any class tested, followed by beta-lactams at 51%. Resistance prevalence correlated with proximity to hospital discharge points, suggesting clinical waste as a significant contributor. Treatment processes reduced overall bacterial load by 92% but resistant strains were disproportionately likely to survive standard chlorination, persisting at higher relative concentrations in treated effluent than in raw influent. The findings suggest current treatment protocols may be inadvertently selecting for resistant strains.",
    aiSummary: "Testing wastewater from three treatment facilities over six months, this study finds high rates of antibiotic resistance, especially near hospital discharge points. Standard chlorination treatment reduces total bacteria but disproportionately fails to eliminate resistant strains, which is a concerning finding for water treatment policy.",
    aiKeyPoints: [
      "Macrolide resistance found in 64% of samples, the highest of any class tested",
      "Resistance prevalence correlated with proximity to hospital discharge points",
      "Standard chlorination reduced bacterial load by 92% overall",
      "Resistant strains survived treatment at disproportionately higher rates",
    ],
  },
  {
    title: "Peer Mentoring Effects on First-Generation University Retention",
    field: "Education",
    authors: ["Nusrat Jahan"],
    abstract: "An analysis of a peer-mentoring program's impact on first-year retention rates among first-generation university students over three academic years.",
    extractedText: "This study tracked first-generation university students across three cohorts, comparing retention rates between students enrolled in a structured peer-mentoring program and a matched control group. Students in the mentoring program showed a first-year retention rate of 87%, compared to 74% in the control group. The effect was strongest among students who attended at least six mentoring sessions in their first semester, with diminishing returns beyond ten sessions. Qualitative interviews suggested that mentoring's primary benefit was normalizing help-seeking behavior rather than direct academic tutoring. The paper recommends universities prioritize early, frequent mentor contact over session intensity.",
    aiSummary: "Tracking three cohorts of first-generation students, this paper finds that a peer-mentoring program raised first-year retention from 74% to 87%. The benefit came mostly from normalizing help-seeking behavior rather than academic tutoring itself, with the strongest effect at 6-10 sessions per semester.",
    aiKeyPoints: [
      "Mentored students had 87% first-year retention vs 74% for the control group",
      "Strongest effect seen with 6-10 mentoring sessions per semester",
      "Primary benefit was normalizing help-seeking, not direct tutoring",
      "Tracked across three academic-year cohorts",
    ],
  },
  {
    title: "Narrative Fragmentation in Post-2000 Bangladeshi Short Fiction",
    field: "Literature",
    authors: ["Rafiul Islam"],
    abstract: "A close reading of five contemporary Bangladeshi short story collections examining the rise of non-linear, fragmented narrative structures since 2000.",
    extractedText: "This paper examines five short story collections published between 2000 and 2020, tracing a shift away from linear narrative toward fragmented, multi-perspective storytelling. This shift is argued to reflect broader social fragmentation following rapid urbanization. Close reading of recurring techniques — including unresolved timelines, unreliable narration, and abrupt perspective shifts — shows these devices are used deliberately to mirror characters' disrupted sense of place and identity, rather than as stylistic novelty alone. The paper situates this trend within a broader regional pattern of post-colonial narrative experimentation, arguing that fragmentation functions as a formal response to the disorientation of rapid social change.",
    aiSummary: "This paper argues that fragmented, non-linear storytelling in Bangladeshi short fiction since 2000 reflects broader social disruption from rapid urbanization, rather than being purely a stylistic trend. It examines five story collections and situates the pattern within regional post-colonial literary experimentation.",
    aiKeyPoints: [
      "Analyzes five short story collections published 2000-2020",
      "Argues fragmentation mirrors social disruption from urbanization",
      "Identifies recurring techniques: unresolved timelines, unreliable narration",
      "Situates the trend within regional post-colonial literary experimentation",
    ],
  },
  {
    title: "Load-Bearing Efficiency of Bamboo-Reinforced Concrete Beams",
    field: "Engineering",
    authors: ["Tanvir Hossain", "Jannat Sumaiya"],
    abstract: "Laboratory testing of bamboo-reinforced concrete beams compared to standard steel-reinforced beams under incremental load, evaluating cost-efficiency for low-rise construction.",
    extractedText: "Twelve concrete beams were cast — six with steel reinforcement and six with treated bamboo reinforcement — and tested under incremental load to failure. Bamboo-reinforced beams reached 68% of the load-bearing capacity of steel-reinforced beams at approximately 22% of the material cost. Failure mode analysis showed bamboo-reinforced beams failed more gradually, giving greater visual warning before structural failure, whereas steel-reinforced beams failed more abruptly at peak load. Treated bamboo showed a 12% reduction in bond strength with concrete after 90 days of humidity exposure, suggesting a durability limitation for long-term outdoor use. The paper concludes bamboo reinforcement is viable for low-rise, cost-constrained construction in humid climates, provided additional waterproof treatment is applied.",
    aiSummary: "Testing bamboo-reinforced concrete beams against steel-reinforced ones, this study finds bamboo reaches 68% of steel's load capacity at just 22% of the material cost, with more gradual (safer) failure. However, bond strength drops 12% after prolonged humidity exposure, suggesting a need for waterproofing in long-term outdoor use.",
    aiKeyPoints: [
      "Bamboo-reinforced beams reached 68% of steel's load capacity at 22% of the cost",
      "Bamboo-reinforced beams failed more gradually, giving more warning",
      "Bond strength dropped 12% after 90 days of humidity exposure",
      "Recommends additional waterproof treatment for outdoor use",
    ],
  },
];

const PLACEHOLDER_PDF = "https://res.cloudinary.com/demo/raw/upload/sample.pdf"; // replace with a real uploaded PDF if you want downloads to work

async function seed() {
  await connectDB();
  const auth = createAuth(getMongoClientDb());

  console.log("Seeding demo user...");
  const demoResult = await auth.api.signUpEmail({ body: DEMO_USER }).catch(() => null);
  const demoUserId = demoResult?.user?.id;

  console.log("Seeding admin user...");
  const adminResult = await auth.api.signUpEmail({ body: ADMIN_USER }).catch(() => null);
  if (adminResult?.user?.id) {
    await mongoose.connection.collection("user").updateOne(
      { _id: new mongoose.Types.ObjectId(adminResult.user.id) },
      { $set: { role: "admin" } }
    );
  }

  if (!demoUserId) {
    console.log("Demo user already exists — skipping paper seeding to avoid duplicates.");
  } else {
    console.log("Seeding sample approved papers...");
    for (const paper of SAMPLE_PAPERS) {
      await Paper.create({
        ...paper,
        fileUrl: PLACEHOLDER_PDF,
        uploadedBy: demoUserId,
        status: "approved",
        views: Math.floor(Math.random() * 120) + 5,
      });
    }
  }

  console.log("\nDone!");
  console.log(`Demo login:  ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log(`Admin login: ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});