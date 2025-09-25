import { Injectable } from "@nestjs/common";
import { SupabaseService } from "src/supabase/supabase.service";
import { NotificationsService } from "src/notifications/notifications.service";
@Injectable()
export class GroupsService {
  constructor(
    private supabaseSer: SupabaseService,
    private notification: NotificationsService,
  ) {}

  async createGroup(name: string, description: string, userId: string) {
    const { data, error } = await this.supabaseSer
      .getClient()
      .from("study_groups")
      .insert([{ name, description, created_by: userId }])
      .select();

    if (error) {
      console.log("Fsiled to create group");
    }

    return data;
  }

  async getAllGroup() {
    const { data, error } = await this.supabaseSer
      .getClient()
      .from("study_groups")
      .select();
    if (error) {
      console.log("Failed to fetch groups");
    }

    return data;
  }

  async joinGroup(
    groupId: string,
    userId: string,
    role: "admin" | "member" = "member",
  ) {
    const { data, error } = await this.supabaseSer
      .getClient()
      .from("group_members")
      .insert([{ group_id: groupId, user_id: userId, role }])
      .select();

    if (error) {
      console.log("Failed to join groups");
    }
    //fetch group names

    const { data: group, error: errorG } = await this.supabaseSer
      .getClient()
      .from("study_groups")
      .select("name")
      .eq("id", groupId)
      .single();

    if (errorG) {
      console.log("failed to fetch group name");
    }

    const groupName = group?.name;

    // group members
    const { data: members, error: errorM } = await this.supabaseSer
      .getClient()
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (errorM) {
      console.log("failed to fetch group members");
    }
    if (members) {
      for (const member of members) {
        if (member.user_id !== userId) {
          await this.notification.createNotification(member.user_id, groupName);
        }
      }
    }

    return data;
  }

  async getMyGroups(userId: string) {
    const { data, error } = await this.supabaseSer
      .getClient()
      .from("group_members")
      .select("group_id, role, study_groups(*)")
      .eq("user_id", userId);

    if (error) {
      console.log("failed to fetch my group");
    }

    return data;
  }

  async deleteGroup(userId: string) {
    const { data, error } = await this.supabaseSer
      .getClient()
      .from("study_groups")
      .delete()
      .eq("created_by", userId);

    if (error) {
      console.log("Failed to delete group");
    }

    return data;
  }

  async updateGroup(groupId: string, name: string, description: string) {
    const { data, error } = await this.supabaseSer
      .getClient()
      .from("study_groups")
      .update({
        name: name,
        description: description,
      })
      .eq("id", groupId);

    if (error) {
      console.log("Failed to update the group info", error.message);
    }
    return data;
  }
}
