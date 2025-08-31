import { Component } from '@angular/core';
import { Sessions,_Session } from '../../services/sessions';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    start_time: '',
    end_time: '',
    location: '',
    group_id: null
  };
    constructor(private authSer:AuthService,
      private sessionSer: Sessions
    ){}

    ngOnInit()
    {
        this.loadSessions();

    }

    loadSessions()
    {
      const user= this.authSer.getCurrentUser();
      const uid= user?.id;
     if (uid) {
      this.sessionSer.getSessionbyGroupID(uid).subscribe({
        next: (data: _Session[]) => {
          this.sessionsArr = data;
        },
        error: (err) => console.log("failed at front", err)
      });
    }
     
    }

   createSession() {
    const user = this.authSer.getCurrentUser();
    if (!user) return;

    //this.newSession.group_id = this.group?.id || user.id;

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
      group_id: null
    };
  }

    leaveGroup()
    {

    }
    goBack()
    {}
}
