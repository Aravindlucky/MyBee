import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { mockObjectives } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

const calculateProgress = (keyResults: typeof mockObjectives[0]['keyResults']) => {
  if (!keyResults.length) return 0;
  const completedCount = keyResults.filter(kr => kr.isCompleted).length;
  return (completedCount / keyResults.length) * 100;
};

export default function GoalsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Goal Setting (OKRs)</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          Set Objectives and Key Results for each semester to stay focused on what matters.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>My Objectives</CardTitle>
          <CardDescription>Your roadmap for personal and professional growth during your MBA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue={`item-${mockObjectives[0].id}`} className="w-full">
            {mockObjectives.map((objective) => {
              const progress = calculateProgress(objective.keyResults);
              return (
                <AccordionItem key={objective.id} value={`item-${objective.id}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex-1 pr-4">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-headline text-lg">{objective.title}</h3>
                        <Badge variant="outline">{objective.semester}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <Progress value={progress} className="h-2" />
                         <span className="text-sm font-semibold text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Key Results</h4>
                      {objective.keyResults.map((kr) => (
                        <div key={kr.id} className="flex items-center space-x-3 p-3 bg-secondary/40 rounded-md">
                          <Checkbox id={`kr-${kr.id}`} checked={kr.isCompleted} />
                          <label
                            htmlFor={`kr-${kr.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {kr.description}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </main>
  );
}
