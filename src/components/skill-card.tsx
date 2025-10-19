'use client';

import { type Skill } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
  onConfidenceChange: (skillId: string, newConfidence: number[]) => void;
  onEdit: (skill: Skill) => void;
  onDeleteTrigger: () => void; // To trigger the alert dialog
}

export function SkillCard({ skill, onConfidenceChange, onEdit, onDeleteTrigger }: SkillCardProps) {
  return (
    <Card className="rounded-xl flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <CardTitle>{skill.name}</CardTitle>
            <Badge variant={skill.type === 'Hard' ? 'default' : 'secondary'}>
              {skill.type} Skill
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onEdit(skill)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => { e.preventDefault(); onDeleteTrigger(); }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Confidence</label>
          <div className="flex items-center gap-4 pt-2">
            <Slider
              value={[skill.latest_confidence]}
              onValueChange={(value) => onConfidenceChange(skill.id, value)}
              max={5}
              min={1}
              step={1}
              className="flex-1"
            />
            <span className="font-bold text-lg text-primary w-4">{skill.latest_confidence}</span>
          </div>
        </div>
      </CardContent>

      {skill.notes && (
        <CardFooter>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Improvement Plan</h4>
            <p className="text-sm text-muted-foreground">{skill.notes}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}