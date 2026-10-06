export type Comparison = {
  slug: string;
  title: string;
  description: string;
  verdict: string;
  bestForA: string;
  bestForB: string;
  rows: [string, string, string][];
  sections: { heading: string; body: string[] }[];
  related: string[];
};

export const comparisons: Comparison[] = [
  {
    slug: "supabase-vs-firebase",
    title: "Supabase vs Firebase: Which Should You Use for a Startup?",
    description: "Compare Supabase and Firebase by database model, authentication, storage, realtime features, developer experience and startup fit.",
    verdict: "For relational SaaS products, Supabase is often the easier default because it is built around PostgreSQL and SQL. Firebase is compelling when its document model, realtime tooling and Google ecosystem fit the product better.",
    bestForA: "SaaS, relational data, SQL-first teams, PostgreSQL portability",
    bestForB: "Realtime apps, mobile-first products, Firebase-native workflows",
    rows: [
      ["Primary database model", "PostgreSQL / relational", "Firestore / document"],
      ["SQL", "Yes", "NoSQL document queries"],
      ["Authentication", "Managed auth", "Firebase Authentication"],
      ["Storage", "Object storage", "Cloud Storage"],
      ["Realtime", "Realtime subscriptions", "Realtime listeners"],
      ["Startup fit", "Excellent for many SaaS products", "Excellent for Firebase-native apps"],
    ],
    sections: [
      { heading: "Choose Supabase when your data is relational", body: ["Users, organizations, subscriptions, permissions and billing naturally form relationships. PostgreSQL makes those relationships explicit and gives teams mature SQL tooling.", "Supabase is particularly attractive when you want a managed platform while keeping PostgreSQL as the underlying database model."] },
      { heading: "Choose Firebase when the product fits its document model", body: ["Firebase can be a strong choice for realtime applications and teams that benefit from its client SDKs and Google ecosystem. It can be especially productive when the application's data naturally maps to documents.", "Before committing, model your most important queries and review current pricing, quotas and platform limits."] },
    ],
    related: ["postgresql-vs-mongodb", "best-tech-stack-for-saas"],
  },
  {
    slug: "nextjs-vs-react",
    title: "Next.js vs React: What's the Difference?",
    description: "Understand the difference between React and Next.js and choose the right frontend architecture for a startup.",
    verdict: "React is the UI library; Next.js is a full React framework with routing, server capabilities and build conventions. For a public web product where SEO and integrated application features matter, Next.js is usually the more complete starting point.",
    bestForA: "Full web applications, SEO, routing, server rendering",
    bestForB: "UI libraries, client-heavy apps, custom frontend architectures",
    rows: [["What it is", "React framework", "UI library"], ["Routing", "Built in", "Choose a router"], ["Server rendering", "Built in", "Requires architecture/framework"], ["SEO", "Straightforward", "More work for client-only apps"], ["Deployment", "Integrated conventions", "More flexible"], ["Best default for SaaS web app", "Often yes", "Sometimes" ]],
    sections: [
      { heading: "Next.js is more than React", body: ["React provides components and a rendering model. Next.js adds application-level conventions such as routing, server components, server-side capabilities and optimized builds.", "That makes Next.js useful when you want one framework to cover the public website and application rather than assembling every layer yourself."] },
      { heading: "When plain React is enough", body: ["A client-rendered React application can be perfectly reasonable for an internal dashboard or product where search visibility is irrelevant. The simpler architecture may be preferable when the surrounding backend and deployment are already established."] },
    ],
    related: ["vercel-vs-railway", "best-tech-stack-for-saas"],
  },
  {
    slug: "nextjs-vs-laravel",
    title: "Next.js vs Laravel: Which Is Better for a Startup?",
    description: "Compare Next.js and Laravel for startup web applications, APIs, teams, deployment and time to market.",
    verdict: "Choose Next.js when React and a unified modern web stack are priorities. Choose Laravel when your team is strong in PHP and wants a mature batteries-included backend framework.",
    bestForA: "React products, full-stack JavaScript/TypeScript teams",
    bestForB: "PHP teams, server-rendered apps, batteries-included backends",
    rows: [["Primary language", "JavaScript / TypeScript", "PHP"], ["UI ecosystem", "React", "Blade / Inertia / any frontend"], ["Backend", "Server capabilities / APIs", "Full backend framework"], ["Database", "Flexible", "Strong ORM and SQL ecosystem"], ["Best advantage", "Unified React web stack", "Mature backend conventions"]],
    sections: [
      { heading: "Choose the stack your team can maintain", body: ["The language and framework your team already knows can outweigh small differences in benchmark performance. A familiar stack reduces debugging time and hiring friction.", "Next.js can minimize the number of frameworks in a React-heavy product. Laravel offers strong conventions for routing, database access, queues, authentication and backend development."] },
    ],
    related: ["nextjs-vs-react", "how-to-choose-a-tech-stack"],
  },
  {
    slug: "nextjs-vs-django",
    title: "Next.js vs Django: Which Stack Should You Choose?",
    description: "Compare Next.js and Django for SaaS products, APIs, teams, AI applications and web development.",
    verdict: "Next.js is attractive for TypeScript-first product teams and unified React applications. Django is attractive when Python, a mature backend framework and data-heavy server-side workflows are central to the product.",
    bestForA: "TypeScript/React products and unified web teams",
    bestForB: "Python backends, data-heavy products and mature server-side workflows",
    rows: [["Primary language", "TypeScript / JavaScript", "Python"], ["Frontend", "React / Next.js", "Django templates or separate frontend"], ["Backend maturity", "Strong web framework capabilities", "Very mature full backend framework"], ["AI/data ecosystem", "Good", "Excellent Python ecosystem"], ["Best default", "Web-first TypeScript product", "Python-heavy application"]],
    sections: [
      { heading: "Pick based on where the complexity lives", body: ["If the core product is a React web application with conventional business logic, Next.js can keep the stack compact. If Python libraries, data processing or machine-learning workflows are central, Django can reduce friction on the backend.", "Either can serve a serious SaaS; the important decision is the team's ability to build and operate it."] },
    ],
    related: ["best-tech-stack-for-ai-startups", "how-to-choose-a-tech-stack"],
  },
  {
    slug: "postgresql-vs-mongodb",
    title: "PostgreSQL vs MongoDB: Which Database Should You Choose?",
    description: "Compare PostgreSQL and MongoDB by data model, transactions, queries, scalability and startup use cases.",
    verdict: "PostgreSQL is a strong default for relational SaaS data. MongoDB can be a better fit when document-oriented data and access patterns make its model simpler.",
    bestForA: "Relational SaaS, reporting, transactions and complex relationships",
    bestForB: "Document-oriented applications and flexible schemas",
    rows: [["Model", "Relational", "Document"], ["Query language", "SQL", "MongoDB query language"], ["Transactions", "Strong relational transactions", "Multi-document transactions available"], ["Schema", "Structured", "Flexible document structure"], ["Best default for SaaS", "Usually", "Depends on data model"]],
    sections: [
      { heading: "Start with your data model", body: ["If your product has users, organizations, subscriptions, permissions and invoices, relationships are first-class data. PostgreSQL makes those relationships explicit and queryable.", "MongoDB can be excellent when documents are naturally accessed together and a flexible document model reduces application complexity."] },
      { heading: "Do not choose based on theoretical scale", body: ["Most startups need a database that is easy to model, back up, query and operate long before they need exotic scaling. Choose the system your team can maintain and measure."] },
    ],
    related: ["supabase-vs-firebase", "best-tech-stack-for-saas"],
  },
  {
    slug: "vercel-vs-railway",
    title: "Vercel vs Railway: Which Hosting Platform Should You Use?",
    description: "Compare Vercel and Railway for startup hosting, deployment, backend services, databases and scaling.",
    verdict: "Vercel is especially compelling for Next.js and frontend-heavy applications. Railway is useful when you want a simple platform for application services, databases and containers in one place.",
    bestForA: "Next.js, frontend-heavy products, web deployment",
    bestForB: "Backend services, databases and simple container-style deployments",
    rows: [["Primary strength", "Web/frontend deployment", "Application infrastructure"], ["Next.js experience", "Excellent", "Good"], ["Managed databases", "Via integrations/providers", "Simple platform deployments"], ["Backend services", "Possible", "Strong fit"], ["Best for", "Web-first teams", "Full-stack infrastructure simplicity"]],
    sections: [
      { heading: "Choose Vercel for a web-first architecture", body: ["Vercel is tightly aligned with Next.js and can make deployments, previews and frontend infrastructure straightforward. It is a natural fit when most of the product is a Next.js application."] },
      { heading: "Choose Railway when infrastructure breadth matters", body: ["Railway can be attractive when you want to deploy several backend services and databases with a simple developer experience. Compare current pricing and resource behavior against your actual workload."] },
    ],
    related: ["nextjs-vs-react", "best-tech-stack-for-saas"],
  },
  {
    slug: "vercel-vs-aws",
    title: "Vercel vs AWS: Which Is Better for a Startup?",
    description: "Compare Vercel and AWS for startup hosting, control, complexity, scaling and cost.",
    verdict: "Use Vercel when developer speed and a managed web platform matter most. Use AWS when infrastructure control, breadth of services or complex architecture requirements justify the additional operational complexity.",
    bestForA: "Fast web deployment and small teams",
    bestForB: "Complex infrastructure, custom networking and deep cloud control",
    rows: [["Abstraction", "High", "Low to high depending on services"], ["Developer speed", "Very high", "Variable"], ["Infrastructure control", "Limited", "Very high"], ["Service breadth", "Focused", "Extremely broad"], ["Operational burden", "Lower", "Higher"], ["Typical early-stage choice", "Often", "When requirements demand it"]],
    sections: [
      { heading: "Do not pay the complexity tax too early", body: ["AWS can support almost any architecture, but that flexibility introduces decisions around networking, IAM, deployment, monitoring and cost management. For a small web startup, managed infrastructure can free the team to focus on the product."] },
      { heading: "Move toward AWS when the requirements are real", body: ["Custom networking, specialized infrastructure, compliance requirements or complex multi-service architectures can justify AWS. The decision should be driven by those constraints rather than the fear that a startup must start on hyperscale infrastructure."] },
    ],
    related: ["vercel-vs-railway", "how-to-choose-a-tech-stack"],
  },
  {
    slug: "react-native-vs-flutter",
    title: "React Native vs Flutter: Which Should You Use for a Mobile App?",
    description: "Compare React Native and Flutter for startup mobile development, teams, performance and ecosystem.",
    verdict: "React Native is attractive for teams already invested in React and JavaScript/TypeScript. Flutter is attractive when a unified Dart-based UI toolkit and consistent cross-platform rendering are priorities.",
    bestForA: "React/TypeScript teams and web-to-mobile products",
    bestForB: "Highly controlled cross-platform UI and Flutter-focused teams",
    rows: [["Language", "JavaScript / TypeScript", "Dart"], ["UI model", "Native components via framework", "Flutter rendering toolkit"], ["Web team reuse", "High for React teams", "Lower"], ["Platform reach", "iOS + Android", "iOS + Android + more"], ["Best fit", "React-heavy startup", "Flutter-first mobile product"]],
    sections: [
      { heading: "Existing team skills matter", body: ["A startup that already ships React and TypeScript can often move faster with React Native. A team committed to Flutter may get more consistency by staying within its existing toolkit."] },
    ],
    related: ["best-tech-stack-for-mvp", "how-to-choose-a-tech-stack"],
  },
  {
    slug: "nodejs-vs-python",
    title: "Node.js vs Python: Which Backend Is Better for a Startup?",
    description: "Compare Node.js and Python for APIs, SaaS products, AI applications, developer experience and scaling.",
    verdict: "Node.js is compelling for TypeScript-first full-stack teams and I/O-heavy APIs. Python is compelling when AI, data processing or Python-specific libraries are central to the product.",
    bestForA: "TypeScript teams, APIs and unified web stacks",
    bestForB: "AI, data science, automation and Python-heavy backends",
    rows: [["Language", "JavaScript / TypeScript", "Python"], ["AI/data ecosystem", "Good", "Excellent"], ["Full-stack language reuse", "Excellent with TypeScript", "Usually separate frontend language"], ["API ecosystem", "Mature", "Mature"], ["Startup default", "Strong web default", "Strong AI/data default"]],
    sections: [
      { heading: "Choose Python when AI is part of the core product", body: ["Python has an unusually deep ecosystem for machine learning, data processing and scientific computing. If those libraries are central, using Python on the backend can simplify the architecture."] },
      { heading: "Choose Node.js when one TypeScript stack wins", body: ["Node.js can be a strong choice for teams that want shared TypeScript types and skills across frontend and backend. It is particularly convenient for I/O-heavy web APIs and real-time applications."] },
    ],
    related: ["fastapi-vs-nodejs", "best-tech-stack-for-ai-startups"],
  },
  {
    slug: "fastapi-vs-nodejs",
    title: "FastAPI vs Node.js: Which Backend Should You Choose?",
    description: "Compare FastAPI and Node.js for APIs, AI products, performance, developer experience and startup architecture.",
    verdict: "FastAPI is a strong fit for Python-first APIs and AI/data workloads. Node.js is a strong fit for TypeScript teams and products that benefit from one language across the web stack.",
    bestForA: "Python APIs, AI/data services and typed API development",
    bestForB: "TypeScript teams, web APIs and unified JavaScript stacks",
    rows: [["Language", "Python", "JavaScript / TypeScript"], ["API style", "Python web framework", "Runtime with many frameworks"], ["AI/data integration", "Excellent", "Good"], ["Type sharing with React", "Limited", "Excellent with TypeScript"], ["Best fit", "Python-centric architecture", "Full-stack TypeScript"]],
    sections: [
      { heading: "FastAPI is particularly good for AI backends", body: ["When model inference, data processing and Python libraries are core to the service, FastAPI provides a clean API layer without forcing the AI workload into another language."] },
      { heading: "Node.js keeps TypeScript teams cohesive", body: ["For a conventional SaaS with a React/Next.js frontend, TypeScript backend services can reduce context switching and allow shared types, validation patterns and tooling."] },
    ],
    related: ["nodejs-vs-python", "best-tech-stack-for-ai-startups"],
  },
];

export const comparisonMap = Object.fromEntries(comparisons.map((item) => [item.slug, item]));
