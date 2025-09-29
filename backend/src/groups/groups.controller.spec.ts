import { Test, TestingModule } from "@nestjs/testing";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto/create-group.dto";
import { SetGroupGoalDto } from "./dto/create-group.dto/set-group_goal.dto";

describe("GroupsController", () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockGroupsService = {
    getAllGroup: jest.fn().mockResolvedValue([{ id: "g1", name: "G" }]),
    getMyGroups: jest.fn().mockResolvedValue([{ group_id: "g1", role: "member", study_groups: { id: "g1", name: "G" } }]),
    createGroup: jest.fn().mockResolvedValue([{ id: "g1", name: "G", description: "D", created_by: "u0" }]),
    setGroupGoals: jest.fn().mockResolvedValue([{ group_id: "g1", title: "Goal 1", created_by: "u0" }]),
    getGroupGoals: jest.fn().mockResolvedValue([{ group_id: "g1", title: "Goal 1", created_by: "u0" }]),
    joinGroup: jest.fn().mockResolvedValue([{ group_id: "g1", user_id: "u0", role: "member" }]),
    deleteGroup: jest.fn().mockResolvedValue([]),
    updateGroup: jest.fn().mockResolvedValue([{ id: "g1", name: "New", description: "New D" }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: mockGroupsService }],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("getAllGroups should return all groups", async () => {
    expect(await controller.getAllGroups()).toEqual([{ id: "g1", name: "G" }]);
  });

  it("getGroupsById should return my groups", async () => {
    expect(await controller.getGroupsById("u1")).toEqual([
      { group_id: "g1", role: "member", study_groups: { id: "g1", name: "G" } },
    ]);
  });

  it("createGroup should create and return group", async () => {
    const dto: CreateGroupDto = { name: "G", description: "D", userId: "u0" };
    expect(await controller.createGroup(dto)).toEqual([{ id: "g1", name: "G", description: "D", created_by: "u0" }]);
  });

  it("setGroupGoal should set group goals", async () => {
    const dto: SetGroupGoalDto = { groupId: "g1", title: "Goal 1", createdBy: "u0" };
    expect(await controller.setGroupGoal(dto)).toEqual([{ group_id: "g1", title: "Goal 1", created_by: "u0" }]);
  });

  it("getGroupGoals should fetch goals", async () => {
    expect(await controller.getGroupGoals("g1")).toEqual([{ group_id: "g1", title: "Goal 1", created_by: "u0" }]);
  });

  it("joinGroup should add member to group", async () => {
    expect(await controller.joinGroup({ groupId: "g1", userId: "u0", role: "member" })).toEqual([
      { group_id: "g1", user_id: "u0", role: "member" },
    ]);
  });

  it("deleteGroup should delete a group", async () => {
    expect(await controller.deleteGroup("u0")).toEqual([]);
  });

  it("updateGroup should update group info", async () => {
    expect(await controller.updateGroup("g1", { name: "New", description: "New D" })).toEqual([
      { id: "g1", name: "New", description: "New D" },
    ]);
  });
});

