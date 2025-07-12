"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function ResourcesPage() {
  const searchParams = useSearchParams()
  const topicParam = searchParams.get("topic")

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("online")

  // Filter resources based on search query and topic parameter
  const filteredOnlineResources = onlineResources.filter((resource) => {
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.topics.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTopic =
      !topicParam || resource.topics.some((topic) => topic.replace(/\s+/g, "-").toLowerCase() === topicParam)

    return matchesSearch && matchesTopic
  })

  const filteredPdfResources = pdfResources.filter((resource) => {
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.topics.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTopic =
      !topicParam || resource.topics.some((topic) => topic.replace(/\s+/g, "-").toLowerCase() === topicParam)

    return matchesSearch && matchesTopic
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Electronics Engineering Study Resources</h1>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      <Tabs defaultValue="online" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="online">Online Documentation</TabsTrigger>
          <TabsTrigger value="pdf">PDF Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="online">
          {filteredOnlineResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOnlineResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  title={resource.title}
                  description={resource.description}
                  type="online"
                  url={resource.url}
                  topics={resource.topics}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No online resources found matching your criteria.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pdf">
          {filteredPdfResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPdfResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  title={resource.title}
                  description={resource.description}
                  type="pdf"
                  url={resource.url}
                  topics={resource.topics}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No PDF resources found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ResourceCardProps {
  title: string
  description: string
  type: "online" | "pdf"
  url: string
  topics: string[]
}

function ResourceCard({ title, description, type, url, topics }: ResourceCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="mb-2 text-amber-500">
          <FileText className="h-6 w-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2 mt-2">
          {topics.map((topic, index) => (
            <Badge key={index} variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          {type === "online" ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Online
            </a>
          ) : (
            <a href={url} download className="flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

const onlineResources = [
  {
    id: 1,
    title: "Circuit Theory Fundamentals",
    description:
      "Learn the basics of circuit theory, including Ohm's law, Kirchhoff's laws, and circuit analysis techniques.",
    url: "https://www.electronics-tutorials.ws/dccircuits/dcp_1.html",
    topics: ["Circuit Theory", "Ohm's Law", "Kirchhoff's Laws"],
  },
  {
    id: 2,
    title: "Digital Electronics Tutorial",
    description:
      "Comprehensive guide to digital electronics, covering logic gates, flip-flops, and digital circuit design.",
    url: "https://www.tutorialspoint.com/digital_circuits/index.htm",
    topics: ["Digital Electronics", "Logic Gates", "Flip-Flops"],
  },
  {
    id: 3,
    title: "Analog Electronics Principles",
    description: "In-depth coverage of analog electronics, including amplifiers, oscillators, and filter design.",
    url: "https://www.allaboutcircuits.com/textbook/semiconductors/",
    topics: ["Analog Electronics", "Amplifiers", "Oscillators"],
  },
  {
    id: 4,
    title: "Microprocessor Architecture and Programming",
    description:
      "Detailed explanation of microprocessor architecture, assembly language programming, and interfacing techniques.",
    url: "https://www.geeksforgeeks.org/microprocessor-tutorials/",
    topics: ["Microprocessors", "Assembly Language", "Interfacing"],
  },
  {
    id: 5,
    title: "Power Electronics Fundamentals",
    description: "Learn about power electronic devices, converters, and their applications in power systems.",
    url: "https://www.electrical4u.com/power-electronics/",
    topics: ["Power Electronics", "Converters", "Power Systems"],
  },
  {
    id: 6,
    title: "Communication Systems",
    description:
      "Comprehensive guide to electronic communication systems, modulation techniques, and digital communications.",
    url: "https://www.electronics-notes.com/articles/radio/",
    topics: ["Communication Systems", "Modulation", "Digital Communications"],
  },
  {
    id: 7,
    title: "Electromagnetic Theory",
    description: "Study of electromagnetic fields, waves, and their applications in electronics engineering.",
    url: "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-013-electromagnetics-and-applications-spring-2009/",
    topics: ["Electromagnetic Theory", "Fields", "Waves"],
  },
  {
    id: 8,
    title: "Control Systems Engineering",
    description: "Learn about control systems, feedback mechanisms, and stability analysis in electronic systems.",
    url: "https://www.control-systems-principles.co.uk/whitepapers.html",
    topics: ["Control Systems", "Feedback", "Stability Analysis"],
  },
  {
    id: 9,
    title: "VLSI Design Principles",
    description: "Introduction to Very Large Scale Integration (VLSI) design concepts and methodologies.",
    url: "https://nptel.ac.in/courses/106/105/106105162/",
    topics: ["VLSI Design", "Integrated Circuits", "Chip Design"],
  },
]

const pdfResources = [
  {
    id: 1,
    title: "Circuit Analysis Techniques",
    description:
      "Comprehensive guide to circuit analysis methods including node analysis, mesh analysis, and theorems.",
    url: "https://web.mit.edu/6.101/www/reference/circuit_analysis.pdf",
    topics: ["Circuit Theory", "Node Analysis", "Mesh Analysis"],
  },
  {
    id: 2,
    title: "Digital Logic Design Handbook",
    description: "Complete reference for digital logic design, combinational and sequential circuits.",
    url: "https://www.ece.ucdavis.edu/~bbaas/281/notes/Handout.logicDesign.pdf",
    topics: ["Digital Electronics", "Combinational Circuits", "Sequential Circuits"],
  },
  {
    id: 3,
    title: "Operational Amplifiers Guide",
    description:
      "Detailed guide to operational amplifiers, their characteristics, and applications in analog circuits.",
    url: "https://www.ti.com/lit/an/sboa092b/sboa092b.pdf",
    topics: ["Analog Electronics", "Operational Amplifiers", "Signal Processing"],
  },
  {
    id: 4,
    title: "8085 Microprocessor Programming",
    description: "Comprehensive guide to 8085 microprocessor architecture and assembly language programming.",
    url: "https://www.iare.ac.in/sites/default/files/lecture_notes/IARE_8085MP_NOTES.pdf",
    topics: ["Microprocessors", "8085", "Assembly Programming"],
  },
  {
    id: 5,
    title: "Power Electronics Devices and Applications",
    description: "Detailed coverage of power electronic devices, converters, and their industrial applications.",
    url: "https://www.electrical-engineering-portal.com/download-center/books-and-guides/power-electronics-devices",
    topics: ["Power Electronics", "Thyristors", "Converters"],
  },
  {
    id: 6,
    title: "Digital Communication Systems",
    description: "Comprehensive study of digital communication systems, modulation techniques, and error correction.",
    url: "https://www.ece.umd.edu/~tretter/commlab/c6713slides/ch4.pdf",
    topics: ["Communication Systems", "Digital Modulation", "Error Correction"],
  },
  {
    id: 7,
    title: "Electromagnetic Field Theory",
    description: "In-depth study of electromagnetic fields, Maxwell's equations, and wave propagation.",
    url: "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-013-electromagnetics-and-applications-spring-2009/readings/MIT6_013S09_notes.pdf",
    topics: ["Electromagnetic Theory", "Maxwell's Equations", "Wave Propagation"],
  },
  {
    id: 8,
    title: "Control Systems Engineering Handbook",
    description: "Complete reference for control systems design, analysis, and implementation in electronic systems.",
    url: "https://engineering.purdue.edu/~andrisan/Courses/AAE364/Handouts/Control%20Systems%20Engineering%20by%20Norman%20Nise.pdf",
    topics: ["Control Systems", "System Response", "Controllers"],
  },
  {
    id: 9,
    title: "CMOS VLSI Design Principles",
    description: "Comprehensive guide to CMOS VLSI design methodologies, layout, and verification techniques.",
    url: "https://www.eecs.umich.edu/courses/eecs427/materials/CMOS_VLSI_Design.pdf",
    topics: ["VLSI Design", "CMOS Technology", "Chip Layout"],
  },
]
