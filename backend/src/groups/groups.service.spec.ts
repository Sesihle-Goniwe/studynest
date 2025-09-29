import { Test, TestingModule } from "@nestjs/testing";
import { GroupsService } from "./groups.service";
import { SupabaseService } from "src/supabase/supabase.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { SetGroupGoalDto } from "./dto/create-group.dto/set-group_goal.dto";

function makeClient(opts?: any) {
  return {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: opts?.data, error: opts?.error }) }),
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: opts?.data, error: opts?.error }) }), order: jest.fn().mockResolvedValue({ data: opts?.data, error: opts?.error }), error: opts?.error, data: opts?.data }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: opts?.data, error: opts?.error }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: opts?.data, error: opts?.error }) }),
    }),
  };
}

describe("GroupsService Error Handling", () => {
  let service: GroupsService;
  let supabaseSvc: { getClient: jest.Mock };
  let notifications: { createNotification: jest.Mock };

  beforeEach(async () => {
    supabaseSvc = { getClient: jest.fn() };
    notifications = { createNotification: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: SupabaseService, useValue: supabaseSvc },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(GroupsService);
  });

  it("createGroup handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.createGroup("G", "D", "u0");
    expect(res).toBeNull(); // or undefined depending on your implementation
  });

  it("getAllGroup handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.getAllGroup();
    expect(res).toBeNull(); // or undefined
  });

  it("joinGroup handles insert error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.joinGroup("g1", "u0", "member");
    expect(res).toBeNull();
  });

  it("joinGroup handles group fetch error", async () => {
    supabaseSvc.getClient.mockReturnValue({
      from: jest.fn((table) => {
        if (table === "study_groups") {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: "fail" } }) }) }) };
        }
        if (table === "group_members") {
          return { insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [{ group_id: "g1", user_id: "u0", role: "member" }], error: null }) }), select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }) };
        }
        return { select: jest.fn().mockReturnValue({ eq: jest.fn(), order: jest.fn() }) };
      }),
    });
    const res = await service.joinGroup("g1", "u0", "member");
    expect(res).toEqual([{ group_id: "g1", user_id: "u0", role: "member" }]);
  });

  it("joinGroup handles members fetch error", async () => {
    supabaseSvc.getClient.mockReturnValue({
      from: jest.fn((table) => {
        if (table === "study_groups") return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { name: "Algebra" }, error: null }) }) }) };
        if (table === "group_members") return { insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [{ group_id: "g1", user_id: "u0", role: "member" }], error: null }) }), select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: { message: "fail" } }) }) };
        return { select: jest.fn() };
      }),
    });
    const res = await service.joinGroup("g1", "u0", "member");
    expect(res).toEqual([{ group_id: "g1", user_id: "u0", role: "member" }]);
  });

  it("getMyGroups handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.getMyGroups("u1");
    expect(res).toBeNull();
  });

  it("deleteGroup handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.deleteGroup("u0");
    expect(res).toBeNull();
  });

  it("updateGroup handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.updateGroup("g1", "New", "New D");
    expect(res).toBeNull();
  });

  it("setGroupGoals handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const dto: SetGroupGoalDto = { groupId: "g1", title: "Goal 1", createdBy: "u0" };
    const res = await service.setGroupGoals(dto);
    expect(res).toBeNull();
  });

  it("getGroupGoals handles error", async () => {
    supabaseSvc.getClient.mockReturnValue(makeClient({ data: null, error: { message: "fail" } }));
    const res = await service.getGroupGoals("g1");
    expect(res).toEqual([]); // getGroupGoals returns [] on error
  });
});
