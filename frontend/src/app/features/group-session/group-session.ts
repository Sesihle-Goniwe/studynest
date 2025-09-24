import { Component } from '@angular/core';
import { Sessions,_Session } from '../../services/sessions';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-group-session',
    standalone: true,
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './group-session.html',
  styleUrls: ['./group-session.scss']
})
export class GroupSession {
    sessionsArr: _Session[]= [];
    currentUser: string | null = null;
    currentUserRole: string | null = null;
   newSession: any = {
    title: '',
    description: '',
    created_by: '',
    start_time: '',
    end_time: '',
    location: '',
    group_id: '',
  };

    groupId:string | null=null;
    constructor(private authSer:AuthService,
      private sessionSer: Sessions,
      private route : ActivatedRoute,
       private router: Router
    ){}

    ngOnInit()
    {
        
        this.groupId = this.route.snapshot.paramMap.get('groupId'); 
        this.newSession.group_id = this.groupId;
        this.newSession.created_by = this.authSer.getCurrentUser()?.id ?? null;
  
        this.loadSessions();
        const user = this.authSer.getCurrentUser();
        const uid = user?.id??null;
        if(!this.groupId || !uid)
        {
          return;
        }
          this.sessionSer.getUserRole(this.groupId,uid).subscribe
          ({
            next: (res: any) => {
            this.currentUserRole = res?.role ?? null;
            },
          });
        
    }

    loadSessions()
    {
      if(this.groupId)
      {
      this.sessionSer.getSessionbyGroupID(this.groupId) .subscribe({
        next: (data: _Session[]) => {
          this.sessionsArr = data;
        },
        error: (err) => console.log("failed at front", err)
      });
    }
     
    }

   createSession() 
   {
 
      this.sessionSer.createSession(this.newSession).subscribe({
      next: (res) => {
        console.log("Session created", res);
        this.sessionsArr.push(res); // update UI immediately
        this.resetForm();
      },
      error: (err) => console.error("Session creation failed", err)
    });
    
  }

  deleteSession(sessionid:string)
  {
    const confirmed = confirm('Are you sure you want to delete this session?');

        if (!confirmed) {
            return; // user cancelled
        }
       this.sessionSer.deleteSession(sessionid).subscribe({
          next: ()=> {
            this.loadSessions();
          },
          error: ()=>
          {
            console.log("failed deleting sessions");
          }
        });
         this.sessionsArr = this.sessionsArr.filter(s => s.id !== sessionid);
  }

  resetForm() {
    this.newSession = {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      group_id: this.groupId
    };
  }

    leaveGroup()
    {
         const confirmed = confirm('Are you sure you want to delete this session?');

        if (!confirmed) {
            return; // user cancelled
        }
        const user = this.authSer.getCurrentUser();
        const uid = user?.id??null;
        if(!uid || !this.groupId) 
        {
          return;
        }
           this.sessionSer.leaveGroup(this.groupId,uid).subscribe({
          next: ()=> {
            this.router.navigate(['/studygroup']);
          },
          error: ()=>
          {
            console.log("failed to leave group");
          }
        });
        
       

    }
    goBack()
    {
        this.router.navigate(['/studygroup'])
    }

}
