import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../auth/auth.service';
import { PostgrestResponse } from '@supabase/supabase-js';
import { StudyGroup } from '../../models/study-group.model';

interface GroupWithRole {
  group: StudyGroup;
  role: 'admin' | 'member';
}

@Component({
  selector: 'app-studygroup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './studygroup.html',
  styleUrls: ['./studygroup.scss']
})
export class StudygroupComponent implements OnInit {
  groupChats: GroupWithRole[] = [];
  newGroupName: string = '';

  constructor(
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  async loadGroups() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const { data, error } = await this.groupService.getMyGroups(user.id);
    if (error) {
      console.error('Error loading groups:', error);
      return;
    }

    this.groupChats =
      data
        ?.map((row: any) => {
          const group = Array.isArray(row.study_groups)
            ? row.study_groups[0] // handle array edge case
            : row.study_groups;

          if (!group) return null;

          return { group, role: row.role } as GroupWithRole;
        })
        .filter((g: GroupWithRole | null): g is GroupWithRole => g !== null) ?? [];
  }

  async createGroup() {
    const user = this.authService.getCurrentUser();
    if (!user) return alert('You must be signed in to create a group');
    if (!this.newGroupName.trim()) return alert('Enter a group name');

    const response: PostgrestResponse<StudyGroup> = await this.groupService.createGroup(
      this.newGroupName,
      'No description yet',
      user.id
    );

    const { data: groupData, error: createError } = response;

    if (createError || !groupData || groupData.length === 0) {
      console.error('Error creating group:', createError);
      return;
    }

    const groupId = groupData[0].id;

    // Add creator as admin
    const joinResponse: PostgrestResponse<any> = await this.groupService.joinGroup(
      groupId,
      user.id,
      'admin'
    );

    if (joinResponse.error) {
      console.error('Error adding creator to group_members:', joinResponse.error);
      return;
    }

    this.newGroupName = '';
    this.loadGroups(); // Refresh the list
  }
}
