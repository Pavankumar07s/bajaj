"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
}

// Mock quiz data - in a real app, this would come from an API
const mockQuizzes: Record<string, { title: string; category: string; questions: Question[] }> = {
  "1": {
    title: "Basic Circuit Theory",
    category: "Circuit Theory",
    questions: [
      {
        id: 1,
        text: "What is Ohm's Law?",
        options: ["V = IR", "P = VI", "I = V/R", "All of the above"],
        correctAnswer: 3,
        explanation:
          "Ohm's Law states that the current through a conductor between two points is directly proportional to the voltage across the two points. It can be expressed as V = IR, I = V/R, or R = V/I, where V is voltage, I is current, and R is resistance.",
      },
      {
        id: 2,
        text: "Which of the following is Kirchhoff's Current Law (KCL)?",
        options: [
          "The algebraic sum of all voltages around any closed loop is zero",
          "The algebraic sum of all currents entering and leaving a node is zero",
          "The total power in a circuit equals the sum of the power dissipated by each component",
          "The resistance of a conductor is directly proportional to its length",
        ],
        correctAnswer: 1,
        explanation:
          "Kirchhoff's Current Law (KCL) states that the algebraic sum of all currents entering and leaving a node is zero. This is based on the principle of conservation of charge.",
      },
      {
        id: 3,
        text: "What is the equivalent resistance of two 10Ω resistors connected in parallel?",
        options: ["20Ω", "5Ω", "10Ω", "0.1Ω"],
        correctAnswer: 1,
        explanation:
          "For resistors in parallel, the equivalent resistance is calculated using the formula 1/Req = 1/R1 + 1/R2 + ... + 1/Rn. For two 10Ω resistors: 1/Req = 1/10 + 1/10 = 2/10, so Req = 5Ω.",
      },
      {
        id: 4,
        text: "What is the time constant of an RC circuit?",
        options: ["R × C", "R / C", "C / R", "R + C"],
        correctAnswer: 0,
        explanation:
          "The time constant (τ) of an RC circuit is calculated as τ = R × C, where R is the resistance in ohms and C is the capacitance in farads. It represents the time it takes for the capacitor to charge or discharge to approximately 63.2% of its final value.",
      },
      {
        id: 5,
        text: "Which theorem states that any linear electrical network with voltage and current sources can be replaced by a single voltage source and a series resistance?",
        options: ["Norton's Theorem", "Thevenin's Theorem", "Superposition Theorem", "Maximum Power Transfer Theorem"],
        correctAnswer: 1,
        explanation:
          "Thevenin's Theorem states that any linear electrical network with voltage and current sources can be replaced by an equivalent circuit consisting of a single voltage source (Vth) in series with a single resistor (Rth).",
      },
    ],
  },
  "2": {
    title: "Digital Logic Design",
    category: "Digital Electronics",
    questions: [
      {
        id: 1,
        text: "Which logic gate performs the operation of logical addition?",
        options: ["AND gate", "OR gate", "NOT gate", "XOR gate"],
        correctAnswer: 1,
        explanation:
          "The OR gate performs logical addition. It outputs a 1 if at least one of its inputs is 1, otherwise it outputs a 0.",
      },
      {
        id: 2,
        text: "What is the Boolean expression for a 2-input NAND gate?",
        options: ["A + B", "A · B", "(A + B)'", "(A · B)'"],
        correctAnswer: 3,
        explanation:
          "The Boolean expression for a 2-input NAND gate is (A · B)', which means the complement (NOT) of the AND operation between inputs A and B.",
      },
      {
        id: 3,
        text: "How many flip-flops are required to build a 4-bit binary counter?",
        options: ["2", "3", "4", "8"],
        correctAnswer: 2,
        explanation:
          "A 4-bit binary counter requires 4 flip-flops, one for each bit position. Each flip-flop represents one bit of the counter's state.",
      },
      {
        id: 4,
        text: "What is the main difference between a latch and a flip-flop?",
        options: [
          "Latches are level-triggered while flip-flops are edge-triggered",
          "Latches have more inputs than flip-flops",
          "Flip-flops are faster than latches",
          "Latches consume less power than flip-flops",
        ],
        correctAnswer: 0,
        explanation:
          "The main difference between latches and flip-flops is that latches are level-triggered (they change state based on the input level), while flip-flops are edge-triggered (they change state only at the rising or falling edge of a clock signal).",
      },
      {
        id: 5,
        text: "Which of the following is NOT a universal gate?",
        options: ["NAND gate", "NOR gate", "XOR gate", "NOT gate"],
        correctAnswer: 2,
        explanation:
          "XOR gate is NOT a universal gate. Universal gates are those from which any other logic gate can be constructed. NAND and NOR are universal gates because any Boolean function can be implemented using only NAND gates or only NOR gates.",
      },
    ],
  },
  "3": {
    title: "Operational Amplifiers",
    category: "Analog Electronics",
    questions: [
      {
        id: 1,
        text: "What is the ideal input impedance of an operational amplifier?",
        options: ["0 Ω", "1 kΩ", "1 MΩ", "Infinite"],
        correctAnswer: 3,
        explanation: "An ideal operational amplifier has infinite input impedance, meaning it draws no current from the input source."
      },
      {
        id: 2,
        text: "What is the purpose of negative feedback in an op-amp circuit?",
        options: [
          "To increase gain",
          "To stabilize the output and reduce distortion",
          "To create oscillations",
          "To increase input impedance"
        ],
        correctAnswer: 1,
        explanation: "Negative feedback is used to stabilize the output, reduce distortion, and make the circuit behavior more predictable and linear."
      },
      {
        id: 3,
        text: "What is the gain of an inverting amplifier with Rf = 10kΩ and Rin = 1kΩ?",
        options: ["-10", "+10", "-0.1", "+0.1"],
        correctAnswer: 0,
        explanation: "The gain of an inverting amplifier is given by -Rf/Rin. Here, it's -(10kΩ/1kΩ) = -10."
      },
      {
        id: 4,
        text: "Which configuration has a gain of +1?",
        options: ["Inverting", "Non-inverting", "Voltage follower", "Differential"],
        correctAnswer: 2,
        explanation: "A voltage follower (buffer) is a special case of the non-inverting amplifier where the gain is unity (+1)."
      },
      {
        id: 5,
        text: "What happens when an op-amp output tries to exceed its power supply voltage?",
        options: ["Nothing", "Saturation occurs", "The op-amp burns out", "The output becomes unstable"],
        correctAnswer: 1,
        explanation: "When an op-amp tries to output a voltage beyond its power supply rails, saturation occurs, limiting the output to slightly less than the supply voltage."
      }
    ]
  },

  "4": {
    title: "Microprocessor Architecture",
    category: "Digital Electronics",
    questions: [
      {
        id: 1,
        text: "What is the purpose of the Program Counter (PC) in a microprocessor?",
        options: [
          "To count the number of programs",
          "To store the address of the next instruction",
          "To count clock cycles",
          "To store temporary data"
        ],
        correctAnswer: 1,
        explanation: "The Program Counter (PC) holds the memory address of the next instruction to be fetched and executed."
      },
      {
        id: 2,
        text: "What addressing mode is used in the instruction MOV AX, [BX]?",
        options: ["Immediate", "Register", "Direct", "Indirect"],
        correctAnswer: 3,
        explanation: "This is indirect addressing mode, where BX contains the memory address of the data to be moved to AX."
      },
      {
        id: 3,
        text: "What is pipelining in microprocessor architecture?",
        options: [
          "A method of connecting processors",
          "A technique to execute multiple instructions simultaneously",
          "A type of memory organization",
          "A bus architecture"
        ],
        correctAnswer: 1,
        explanation: "Pipelining is a technique where multiple instructions are overlapped in execution to improve processor throughput."
      },
      {
        id: 4,
        text: "What is the function of the ALU?",
        options: [
          "Memory management",
          "Input/Output control",
          "Arithmetic and logical operations",
          "Instruction decoding"
        ],
        correctAnswer: 2,
        explanation: "The Arithmetic Logic Unit (ALU) performs arithmetic and logical operations on data."
      },
      {
        id: 5,
        text: "What is the role of the stack pointer?",
        options: [
          "Points to the top of the stack",
          "Counts stack operations",
          "Stores stack data",
          "Controls stack access"
        ],
        correctAnswer: 0,
        explanation: "The Stack Pointer (SP) contains the address of the top of the stack, which is used for temporary storage and subroutine calls."
      }
    ]
  },

  "5": {
    title: "Power Electronics",
    category: "Analog Electronics",
    questions: [
      {
        id: 1,
        text: "What is the main application of a thyristor?",
        options: [
          "Power amplification",
          "Voltage regulation",
          "Power control",
          "Signal processing"
        ],
        correctAnswer: 2,
        explanation: "Thyristors are mainly used for power control in AC circuits, such as in motor speed controls and power supplies."
      },
      {
        id: 2,
        text: "What is the advantage of using PWM in power electronics?",
        options: [
          "Simplified circuit design",
          "Lower cost",
          "Better efficiency and control",
          "Reduced component count"
        ],
        correctAnswer: 2,
        explanation: "PWM (Pulse Width Modulation) provides better efficiency and precise control of power delivery to loads."
      },
      {
        id: 3,
        text: "Which device is used for DC to AC conversion?",
        options: ["Rectifier", "Inverter", "Chopper", "Converter"],
        correctAnswer: 1,
        explanation: "An inverter converts DC (Direct Current) to AC (Alternating Current)."
      },
      {
        id: 4,
        text: "What is the function of a flyback diode in a switching circuit?",
        options: [
          "Voltage amplification",
          "Current limiting",
          "Protection from inductive kickback",
          "Frequency control"
        ],
        correctAnswer: 2,
        explanation: "A flyback diode protects switching devices from voltage spikes caused by inductive loads."
      },
      {
        id: 5,
        text: "Which parameter is most important in high-frequency switching applications?",
        options: [
          "Forward voltage drop",
          "Switching speed",
          "Physical size",
          "Cost"
        ],
        correctAnswer: 1,
        explanation: "Switching speed is crucial in high-frequency applications to minimize switching losses and improve efficiency."
      }
    ]
  },

  "6": {
    title: "Communication Systems",
    category: "Communication Systems",
    questions: [
      {
        id: 1,
        text: "What is the advantage of FM over AM?",
        options: [
          "Better bandwidth efficiency",
          "Less noise susceptibility",
          "Simpler circuitry",
          "Lower power requirement"
        ],
        correctAnswer: 1,
        explanation: "FM (Frequency Modulation) has better noise immunity compared to AM (Amplitude Modulation) as noise mainly affects signal amplitude."
      },
      {
        id: 2,
        text: "What is the Nyquist sampling theorem?",
        options: [
          "Sampling frequency must equal signal frequency",
          "Sampling frequency must be twice the highest signal frequency",
          "Sampling frequency must be half the signal frequency",
          "Sampling frequency must be random"
        ],
        correctAnswer: 1,
        explanation: "The Nyquist theorem states that the sampling frequency must be at least twice the highest frequency component in the signal to avoid aliasing."
      },
      {
        id: 3,
        text: "What is QPSK?",
        options: [
          "Quadrature Phase Shift Keying",
          "Quarter Phase Shift Keying",
          "Quantum Phase Shift Keying",
          "Quality Phase Shift Keying"
        ],
        correctAnswer: 0,
        explanation: "QPSK (Quadrature Phase Shift Keying) is a digital modulation scheme that uses four phase states to encode two bits per symbol."
      },
      {
        id: 4,
        text: "What does SNR represent?",
        options: [
          "Signal to Noise Ratio",
          "System Network Response",
          "Signal Network Range",
          "System Noise Reduction"
        ],
        correctAnswer: 0,
        explanation: "SNR (Signal to Noise Ratio) is the ratio of signal power to noise power, expressed in decibels."
      },
      {
        id: 5,
        text: "What is the purpose of error correction coding?",
        options: [
          "To increase transmission speed",
          "To reduce power consumption",
          "To detect and correct transmission errors",
          "To compress data"
        ],
        correctAnswer: 2,
        explanation: "Error correction coding adds redundancy to data to detect and correct errors that occur during transmission."
      }
    ]
  }
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const quizId = params.id
  const quiz = mockQuizzes[quizId]

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(quiz?.questions.length || 0).fill(-1))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Quiz Not Found</h1>
        <p className="mb-8">The quiz you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/quizzes")} className="bg-amber-500 hover:bg-amber-600">
          Back to Quizzes
        </Button>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  const handleAnswerSelect = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers]
    newSelectedAnswers[currentQuestionIndex] = answerIndex
    setSelectedAnswers(newSelectedAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowExplanation(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setShowExplanation(false)
    }
  }

  const calculateScore = () => {
    let correctAnswers = 0
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++
      }
    })
    return correctAnswers
  }

  if (quizCompleted) {
    const score = calculateScore()
    const percentage = Math.round((score / quiz.questions.length) * 100)

    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
            <CardDescription>You've completed the {quiz.title} quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-amber-500" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Your Score</h3>
              <p className="text-3xl font-bold text-amber-500 mb-2">{percentage}%</p>
              <p className="text-muted-foreground">
                You answered {score} out of {quiz.questions.length} questions correctly
              </p>
            </div>

            <div className="pt-6 border-t">
              <h3 className="font-medium mb-4">Performance Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Correct Answers</span>
                  <span className="font-medium">{score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Incorrect Answers</span>
                  <span className="font-medium">{quiz.questions.length - score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Questions</span>
                  <span className="font-medium">{quiz.questions.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="font-medium text-amber-800 mb-2">Need More Help?</h3>
              <p className="text-sm text-amber-700 mb-3">
                If you'd like to improve your understanding of {quiz.category}, check out our study resources or ask our
                AI assistant for help.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100">
                  <Link href="/resources">Study Resources</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100">
                  <Link href="/chat">Ask AI Assistant</Link>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/quizzes")}>
              Back to Quizzes
            </Button>
            <Button
              onClick={() => {
                setQuizCompleted(false)
                setCurrentQuestionIndex(0)
                setSelectedAnswers(Array(quiz.questions.length).fill(-1))
                setShowExplanation(false)
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Retry Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>{quiz.title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <h3 className="text-xl font-medium mb-6">{currentQuestion.text}</h3>

          <RadioGroup
            value={selectedAnswers[currentQuestionIndex].toString()}
            onValueChange={(value) => handleAnswerSelect(Number.parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors ${
                  showExplanation && index === currentQuestion.correctAnswer ? "border-green-500 bg-green-50" : ""
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {showExplanation && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Explanation:</h4>
              <p className="text-sm text-amber-700">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Need a hint?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Hint</DialogTitle>
                  <DialogDescription>Consider the following hint for this question:</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.id === 1
                      ? "Think about the fundamental relationship between voltage, current, and resistance in electrical circuits."
                      : "Review the basic principles and definitions related to this topic in your study materials."}
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowExplanation(true)}>
                    Show Answer Explanation
                  </Button>
                  <Button asChild className="bg-amber-500 hover:bg-amber-600">
                    <Link href="/chat">Ask AI Assistant</Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)}>
              {showExplanation ? "Hide Explanation" : "Show Explanation"}
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestionIndex] === -1}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? "Finish" : "Next"}
            {currentQuestionIndex < quiz.questions.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
