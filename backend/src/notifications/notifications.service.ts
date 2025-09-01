import { Injectable } from '@nestjs/common';
import { MailerService } from 'src/mailer/mailer.service';
import { SupabaseService } from 'src/supabase/supabase.service';
@Injectable()
export class NotificationsService {
    constructor(public readonly supabaseSer:SupabaseService
        , private readonly mailer:MailerService
    ){}

    async getAllNotifications()
    {
        const {data, error} = await this.supabaseSer
        .getClient()
        .from('notifications')
        .select('*')
        .order('created_at',{ascending:false});

        if (error)
        {
            throw new Error(error.message);
        }
        return data

    }

    ///Insert a notification

    async createNotification(userId:string,message: string)
    {
        const {data, error} = await this.supabaseSer
        .getClient()
        .from('notifications')
        .insert([{user_id:userId,message}])
        .select()
        .single();

        if(error)
        {
            console.log("failed to insert notification");
        }
      

        //fetching user email
        const {data: user, error:userE} = await this.supabaseSer
        .getClient()
        .from('students')
        .select('email')
        .eq('user_id',userId)
        .single()

        if (userE) 
        {
            console.log("error finding email");
        }
          else {
            await this.mailer.sendMail(
                user.email,
                message,
                `${message}`
            );

          return data;
    }
}

   // Get notification by user

   
    async getNotifications(userId:string)
    {
        const {data, error} = await this.supabaseSer
        .getClient()
        .from('notifications')
        .select('*')
        .eq('user_id',userId)
        .order('created_at',{ascending:false});

        if (error)
        {
           console.log("failed to get notifications");
        }
        return data

    }

    //mark notifications read
    async markAsRead(notificationId:string)
    {
        const  {data, error} = await this.supabaseSer
        .getClient()
        .from('notifications')
        .update({read : true})
        .eq('id',notificationId)
        .select()

        if(error)
        {
            console.log("Failed to mark as read");
        }

        return data?.[0];
    }

    async clearNotifications(userId:string)
    {
          if (!userId) {
    console.error("No user found with id", userId);
    return null;
  }
        const {data,error} = await this.supabaseSer
        .getClient()
        .from('notifications')
        .delete()
        .eq('user_id',userId);

        if(error)
        {
            console.log("Failed to delete");

        }
    
    return data;
    }

}
