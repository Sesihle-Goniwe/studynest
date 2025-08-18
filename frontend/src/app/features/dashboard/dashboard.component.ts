import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent  {
    displayName : string | null =null;
    userID: string | null=null;

    constructor(private authser : AuthService,private router: Router){}

    ngOnInit()
    {
      const user = this.authser.getCurrentUser();
      if (user)
      {
        this.userID=user.id;
        this.displayName=this.authser.getUserDisplayName();
      }
    }

 async handleSignOut() 
  {
    await this.authser.signOut();

  }

  goToProfile()
  {
    this.router.navigate(['/profile']);
  }
  goToStudyGroups()
  {
    this.router.navigate(['/studygroup']);
  }
  goToProgress()
  {
    this.router.navigate(['./progress']);
  }
}