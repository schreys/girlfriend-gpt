"use client";

import type { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface ConversationSettingsProps {
  name: string;
  onNameChange: (name: string) => void;
  language: 'english' | 'dutch';
  onLanguageChange: (language: 'english' | 'dutch') => void;
}

const ConversationSettings: FC<ConversationSettingsProps> = ({
  name,
  onNameChange,
  language,
  onLanguageChange,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="girlfriend-name" className="text-base">Girlfriend's Name</Label>
          <Input
            id="girlfriend-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="E.g., Luna, Sophie"
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="language-select" className="text-base">Language</Label>
          <Select
            value={language}
            onValueChange={(value: 'english' | 'dutch') => onLanguageChange(value)}
          >
            <SelectTrigger id="language-select" className="w-full text-base">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="dutch">Dutch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationSettings;
