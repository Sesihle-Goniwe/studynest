export class SetGroupGoalDto {
  groupId: string;    // The ID of the study group
  title: string;      // The goal description/title
  createdBy: string;  // The user ID of the admin creating the goal
}