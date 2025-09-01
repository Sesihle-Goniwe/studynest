import { Component } from '@angular/core';
import { Sessions,_Session } from '../../services/sessions';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-group-session',
  imports: [CommonModule,FormsModule],
  templateUrl: './group-session.html',
  styleUrl: './group-session.scss'
})
export class GroupSession {
    sessionsArr: _Session[]= [];
    currentUser: string | null = null;

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
      private route : ActivatedRoute
    ){}

    ngOnInit()
    {
        
        this.groupId = this.route.snapshot.paramMap.get('groupId'); 
        this.newSession.group_id = this.groupId;
        this.newSession.created_by = this.authSer.getCurrentUser()?.id ?? null;
  
        this.loadSessions();
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

    }
    goBack()
    {}
}
