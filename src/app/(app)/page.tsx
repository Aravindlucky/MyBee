import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Book, BookOpen, FileText, Flag, Target } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    title: "Course Dashboard",
    description: "Syllabus, deadlines, and grade tracking for each course.",
    href: "/courses",
    icon: BookOpen,
    image: PlaceHolderImages.find(p => p.id === 'dashboard-courses'),
  },
  {
    title: "Case Study Analyzer",
    description: "Break down business cases with AI-powered framework suggestions.",
    href: "/case-studies",
    icon: FileText,
    image: PlaceHolderImages.find(p => p.id === 'dashboard-cases'),
  },
  {
    title: "MBA Skill Tracker",
    description: "Monitor and plan your hard and soft skill development.",
    href: "/skills",
    icon: Target,
    image: PlaceHolderImages.find(p => p.id === 'dashboard-skills'),
  },
  {
    title: "Goal Setting (OKRs)",
    description: "Set and track your objectives and key results each semester.",
    href: "/goals",
    icon: Flag,
    image: PlaceHolderImages.find(p => p.id === 'dashboard-goals'),
  },
  {
    title: "Reflection Journal",
    description: "A private space for your daily thoughts and learnings.",
    href: "/journal",
    icon: Book,
    image: PlaceHolderImages.find(p => p.id === 'dashboard-journal'),
  },
];

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">MBA Command Center</h1>
        <p className="text-muted-foreground max-w-3xl text-lg">
          Your intelligent platform to streamline academics, accelerate career development, and maximize personal growth throughout your MBA journey.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <Link href={feature.href} className="flex flex-col h-full group">
              {feature.image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={feature.image.imageUrl}
                    alt={feature.image.description}
                    fill
                    className="object-cover rounded-t-xl"
                    data-ai-hint={feature.image.imageHint}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="size-7 text-primary" />
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
              <CardFooter className="mt-auto">
                <div className="flex items-center text-sm font-bold text-primary group-hover:underline">
                  Go to {feature.title} <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
