import { StudyGroup } from './study-group.model';

// Represents a group + the role of the current user
export interface GroupWithRole {
  group: StudyGroup;
  role: 'admin' | 'member';
}