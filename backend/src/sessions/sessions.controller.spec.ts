import { Test, TestingModule } from "@nestjs/testing";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";

describe("SessionsController", () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockSessionsService = {
    createSession: jest.fn(),
    getSessionByGroup: jest.fn(),
    getUserRole: jest.fn(),
    deleteSession: jest.fn(),
    leaveGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [{ provide: SessionsService, useValue: mockSessionsService }],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get<SessionsService>(SessionsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createSession", () => {
    it("should call SessionsService.createSession", async () => {
      const dto = { title: "Test Session" };
      mockSessionsService.createSession.mockResolvedValue(dto);

      const result = await controller.createSession(dto);
      expect(result).toEqual(dto);
      expect(service.createSession).toHaveBeenCalledWith(dto);
    });
  });

  describe("getSessionByGroup", () => {
    it("should call SessionsService.getSessionByGroup", async () => {
      const groupId = "group1";
      const mockData = [{ id: "session1" }];
      mockSessionsService.getSessionByGroup.mockResolvedValue(mockData);

      const result = await controller.getSessionByGroup(groupId);
      expect(result).toEqual(mockData);
      expect(service.getSessionByGroup).toHaveBeenCalledWith(groupId);
    });
  });

  describe("getUserRole", () => {
    it("should call SessionsService.getUserRole", async () => {
      const groupId = "group1";
      const userId = "user1";
      const mockRole = "member";
      mockSessionsService.getUserRole.mockResolvedValue(mockRole);

      const result = await controller.getUserRole(groupId, userId);
      expect(result).toEqual(mockRole);
      expect(service.getUserRole).toHaveBeenCalledWith(groupId, userId);
    });
  });

  describe("deleteSession", () => {
    it("should call SessionsService.deleteSession", async () => {
      const sessionId = "session1";
      mockSessionsService.deleteSession.mockResolvedValue(true);

      const result = await controller.deleteSession(sessionId);
      expect(result).toEqual(true);
      expect(service.deleteSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe("leaveGroup", () => {
    it("should call SessionsService.leaveGroup", async () => {
      const groupId = "group1";
      const userId = "user1";
      mockSessionsService.leaveGroup.mockResolvedValue(true);

      const result = await controller.leaveGroup(groupId, userId);
      expect(result).toEqual(true);
      expect(service.leaveGroup).toHaveBeenCalledWith(groupId, userId);
    });
  });
});
