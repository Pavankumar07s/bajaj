import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Clock, Users, BarChart, Cpu, CircuitBoardIcon as Circuit, Zap, Radio } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function QuizzesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Electronics Engineering Quizzes</h1>

      <Tabs defaultValue="internal" className="w-full mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="internal">Internal Quizzes</TabsTrigger>
          <TabsTrigger value="external">External Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          <div className="bg-muted p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">External Quiz Platforms</h2>
            <p className="mb-6">
              We've integrated with external platforms to provide you with additional quizzes and challenges. These
              platforms offer a wide range of electronics engineering quizzes to test your knowledge.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExternalQuizCard
                title="Unstop Electronics Quizzes"
                description="Access a variety of electronics engineering quizzes and competitions on Unstop."
                url="https://unstop.com/quizzes"
                icon={<Circuit className="h-8 w-8" />}
              />

              <ExternalQuizCard
                title="IEEE Electronics Learning"
                description="Test your knowledge with IEEE's electronics engineering quizzes and assessments."
                url="https://www.ieee.org/education/learning-resources.html"
                icon={<Cpu className="h-8 w-8" />}
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-amber-800">Featured External Quiz</h3>
            <p className="mb-4 text-amber-700">
              We recommend trying the "Electronics Engineering Fundamentals" quiz series on Unstop, which covers a
              comprehensive range of topics from basic circuit theory to advanced digital systems.
            </p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600">
              <a href="https://unstop.com/quizzes" target="_blank" rel="noopener noreferrer">
                Access Featured Quiz
              </a>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface QuizCardProps {
  quiz: Quiz
}

function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getQuizIcon(quiz.category)}
            <CardTitle>{quiz.title}</CardTitle>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <CardDescription>{quiz.category}</CardDescription>
          <Badge variant={getBadgeVariant(quiz.difficulty)}>{quiz.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{quiz.duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{quiz.attempts} attempts</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            <span>{quiz.questions} questions</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-amber-500 hover:bg-amber-600">
          <Link href={`/quizzes/${quiz.id}`}>Start Quiz</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

interface ExternalQuizCardProps {
  title: string
  description: string
  url: string
  icon: React.ReactNode
}

function ExternalQuizCard({ title, description, url, icon }: ExternalQuizCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="text-amber-500">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Access Quizzes
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

function getBadgeVariant(difficulty: string): "default" | "outline" | "secondary" | "destructive" {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "default"
    case "medium":
      return "secondary"
    case "hard":
      return "destructive"
    default:
      return "outline"
  }
}

function getQuizIcon(category: string) {
  switch (category.toLowerCase()) {
    case "circuit theory":
      return <Circuit className="h-5 w-5 text-amber-500" />
    case "digital electronics":
      return <Cpu className="h-5 w-5 text-amber-500" />
    case "analog electronics":
      return <Zap className="h-5 w-5 text-amber-500" />
    case "communication systems":
      return <Radio className="h-5 w-5 text-amber-500" />
    default:
      return <Circuit className="h-5 w-5 text-amber-500" />
  }
}

interface Quiz {
  id: number
  title: string
  description: string
  category: string
  difficulty: string
  duration: number
  questions: number
  attempts: number
}

const quizzes: Quiz[] = [
  {
    id: 1,
    title: "Basic Circuit Theory",
    description:
      "Test your knowledge of fundamental circuit theory concepts including Ohm's Law, Kirchhoff's Laws, and circuit analysis techniques.",
    category: "Circuit Theory",
    difficulty: "Easy",
    duration: 15,
    questions: 20,
    attempts: 1243,
  },
  {
    id: 2,
    title: "Digital Logic Design",
    description:
      "Challenge yourself with questions on logic gates, Boolean algebra, flip-flops, and sequential circuits.",
    category: "Digital Electronics",
    difficulty: "Medium",
    duration: 25,
    questions: 25,
    attempts: 856,
  },
  {
    id: 3,
    title: "Operational Amplifiers",
    description:
      "Test your understanding of op-amp characteristics, configurations, and applications in analog circuits.",
    category: "Analog Electronics",
    difficulty: "Medium",
    duration: 20,
    questions: 15,
    attempts: 1089,
  },
  {
    id: 4,
    title: "Microprocessor Architecture",
    description: "Assess your knowledge of microprocessor architecture, instruction sets, and addressing modes.",
    category: "Digital Electronics",
    difficulty: "Hard",
    duration: 30,
    questions: 25,
    attempts: 732,
  },
  {
    id: 5,
    title: "Power Electronics",
    description:
      "Test your knowledge of power electronic devices, converters, and their applications in power systems.",
    category: "Analog Electronics",
    difficulty: "Hard",
    duration: 25,
    questions: 20,
    attempts: 645,
  },
  {
    id: 6,
    title: "Communication Systems",
    description: "Evaluate your understanding of modulation techniques, digital communications, and signal processing.",
    category: "Communication Systems",
    difficulty: "Medium",
    duration: 30,
    questions: 25,
    attempts: 912,
  },
]
