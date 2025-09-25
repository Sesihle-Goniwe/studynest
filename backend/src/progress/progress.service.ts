// src/progress/progress.service.ts

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { CreateStudyLogDto } from "./dto/create-study-log.dto";

@Injectable()
export class ProgressService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // We'll need a way to get the Supabase client easily
  private get supabase() {
    return this.supabaseService.getClient();
  }

  // src/progress/progress.service.ts

  async createTopic(createTopicDto: CreateTopicDto) {
    // 1. You still get the properties from the DTO
    const { name, file_id, userId } = createTopicDto;

    const { data, error } = await this.supabase
      .from("topics")
      .insert({
        // 2. Build the object manually with the correct column names
        name: name,
        file_id: file_id,
        user_id: userId, // This now correctly matches your database table
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating topic:", error);
      throw new InternalServerErrorException(
        "Failed to create topic.",
        error.message,
      );
    }
    return data;
  }

  async findAllTopicsForUser(userId: string) {
    const { data, error } = await this.supabase
      .from("topics")
      .select("id, name, status, created_at, file_id, date_completed")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching topics:", error);
      throw new InternalServerErrorException(
        "Failed to fetch topics.",
        error.message,
      );
    }
    return data;
  }
  // Log study hours
  async addStudyLog(createStudyLogDto: CreateStudyLogDto) {
    const { userId, topicId, date, hours } = createStudyLogDto;

    const { data, error } = await this.supabase
      .from("study_logs")
      .insert({ user_id: userId, topic_id: topicId, date, hours: hours })
      .select()
      .single();

    if (error) {
      console.error("Error adding study log:", error);
      throw new InternalServerErrorException(
        "Failed to add study log.",
        error.message,
      );
    }
    return data;
  }

  // This is the only method you need for fetching study logs.
  async getStudyLogs(userId: string, topicId?: string) {
    // Be explicit with your select statement for maximum reliability
    const selectStatement = "id, date, hours, topic_id, topic:topics(name)";

    let query = this.supabase
      .from("study_logs")
      .select(selectStatement)
      .eq("user_id", userId);

    if (topicId) {
      query = query.eq("topic_id", topicId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching study logs:", error);
      throw new InternalServerErrorException(
        "Failed to fetch study logs.",
        error.message,
      );
    }

    return data;
  }
  async updateStatus(id: string, status: string) {
    const updatePayload: { status: string; date_completed?: string } = {
      status: status,
    };

    // If the new status is 'Completed', add the current date to the payload
    if (status === "Completed") {
      updatePayload.date_completed = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from("topics")
      .update(updatePayload) // Use the dynamic payload
      .eq("id", id)
      .select();

    if (error) {
      throw new InternalServerErrorException(
        "Failed to update topic status.",
        error.message,
      );
    }
    return data;
  }

  async remove(id: string) {
    // Step 1: Delete all study logs linked to this topic
    const { error: logError } = await this.supabase
      .from("study_logs")
      .delete()
      .eq("topic_id", id);

    if (logError) {
      throw new InternalServerErrorException(
        "Failed to delete associated study logs.",
        logError.message,
      );
    }

    // Step 2: Now it's safe to delete the topic itself
    const { error: topicError } = await this.supabase
      .from("topics")
      .delete()
      .eq("id", id);

    if (topicError) {
      throw new InternalServerErrorException(
        "Failed to delete topic.",
        topicError.message,
      );
    }

    return { message: `Topic with id ${id} deleted successfully.` };
  }
  async findUserGroups(userId: string) {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("group:study_groups(id, name)")
      .eq("user_id", userId);

    if (error) {
      throw new InternalServerErrorException("Failed to fetch user groups.");
    }
    // The data is nested, so we extract just the group objects
    return data.map((item) => item.group);
  }

  async getRankingsForGroup(groupId: string) {
    const { data, error } = await this.supabase.rpc("get_group_rankings", {
      group_id_param: groupId,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      throw new InternalServerErrorException("Failed to fetch group rankings.");
    }
    return data;
  }
  // We will expand this with more methods like logHours, updateStatus etc. later.
}
