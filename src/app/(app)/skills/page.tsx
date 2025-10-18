import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { mockSkills } from "@/lib/data";

export default function SkillsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">MBA Skill Tracker</h1>
        <p className="text-muted-foreground max-w-2xl text-lg mt-2">
          Track key hard and soft skills you want to develop during your MBA.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>My Skills</CardTitle>
          <CardDescription>Rate your confidence (1-5) at the start of each semester and track your progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Skill</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[200px]">Confidence</TableHead>
                <TableHead>Improvement Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSkills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell>
                    <Badge variant={skill.type === 'Hard' ? 'default' : 'secondary'}>
                      {skill.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Slider
                        defaultValue={[skill.confidence]}
                        max={5}
                        min={1}
                        step={1}
                        className="w-[120px]"
                      />
                      <span className="font-bold text-lg text-primary">{skill.confidence}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{skill.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
