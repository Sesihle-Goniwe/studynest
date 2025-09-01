import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../auth/auth.service';
import { StudyGroup } from '../../models/study-group.model';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
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
  memberGroups: GroupWithRole[] = [];
  nonMemberGroups: StudyGroup[] = [];
  newGroupName: string = '';
  newGroupDescription: string = '';
  isLoading = false;
  errorMessage = '';
  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    const groupId = this.route.snapshot.paramMap.get('groupId');
  }

  loadGroups() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading = true;
    this.errorMessage = '';

    // 1. First, fetch the user's member groups with roles
    this.groupService.getMyGroups(user.id).subscribe({
      next: (memberData: any[]) => {
        // Process member groups
        this.memberGroups = memberData
          .map((row: any) => {
            const group = Array.isArray(row.study_groups)
              ? row.study_groups[0]
              : row.study_groups;

            if (!group) return null;

            return { group, role: row.role } as GroupWithRole;
          })
          .filter((g: GroupWithRole | null): g is GroupWithRole => g !== null);

        // 2. Then fetch all groups to find non-member groups
        this.groupService.getAllGroups().subscribe({
          next: (allGroups: StudyGroup[]) => {
            const memberIds = this.memberGroups.map(m => m.group.id);
            this.nonMemberGroups = allGroups.filter(g => !memberIds.includes(g.id));
            this.isLoading = false;
          },
          error: (allError) => {
            console.error('Error loading all groups:', allError);
            this.isLoading = false;
          }
        });
      },
      error: (memberError) => {
        console.error('Error loading member groups:', memberError);
        this.isLoading = false;
      }
    });
  }

  createGroup() {
    const user = this.authService.getCurrentUser();
    const uid = user?.id;
    if(uid) {
      if (!this.newGroupName.trim()) return alert('Enter a group name');

      this.isLoading = true;
      this.errorMessage = '';

      this.groupService.createGroup(
        this.newGroupName,
        this.newGroupDescription || 'No description yet',
        uid
      ).subscribe({
        next: (groupData: StudyGroup[]) => {  
          if (groupData && groupData.length > 0) {
            const groupId = groupData[0].id;
            // Add creator as admin
            this.groupService.joinGroup(groupId, uid, 'admin').subscribe({
              next: () => {
                this.newGroupName = '';
                this.newGroupDescription = '';
                this.loadGroups(); // Refresh the lists
              },
              error: () => {
                console.error('Error adding creator to group:');
                this.isLoading = false;
              }
            });
          }
        },
        error: () => {
          console.error('Error creating group:');
          this.errorMessage = 'Failed to create group';
          this.isLoading = false;
        }
      });
    }
  }

  joinGroup(group_id: string) {
    const user = this.authService.getCurrentUser();
    const uid = user?.id;
    if (user) {
      this.isLoading = true;
      this.errorMessage = '';
      this.groupService.joinGroup(group_id, user.id, 'member').subscribe({
        next: () => {
          this.loadGroups(); // This will refresh both lists
        },
        error: (error) => {
          console.error('Error joining group:', error);
          this.isLoading = false;
        }
      });
    }
  }
  viewGroup(groupId:string)
  {
     this.router.navigate(['/viewGroups',groupId])
  }
}