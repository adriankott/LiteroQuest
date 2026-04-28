import { NodeType } from '../types/adventure';

export type RootStackParamList = {
  Welcome: undefined;
  ProfileSelect: undefined;
  CreateProfile: undefined;
  Home: undefined;
  Alphabet: undefined;
  LetterDetail: { letterIndex: number };
  Phonics: undefined;
  Words: undefined;
  Progress: undefined;
  Adventure: undefined;
  AdventureNode: {
    runId: number;
    nodeId: string;
    nodeType: NodeType;
    difficulty: 1 | 2 | 3;
    floor: number;
  };
};
