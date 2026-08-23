import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  position: number;
  projectId: string;
  creatorId: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; avatarUrl?: string };
  creator?: { id: string; name: string; avatarUrl?: string };
  dueDate?: string | null;
  createdAt: string;
  _count?: { comments: number };
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  ownerId: string;
  members: Member[];
  tasks?: Task[];
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  selectedTask: Task | null;
  currentUserRole: string | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  moveTask: (taskId: string, newStatus: Task['status'], newPosition: number) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
      if (res.data.projects.length > 0 && !currentProject) {
        selectProject(res.data.projects[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProject = async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setCurrentProject(res.data.project);
      setCurrentUserRole(res.data.currentUserRole);
      setTasks(res.data.project.tasks || []);

      // Join socket room
      const socket = getSocket();
      socket.emit('join:project', projectId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Real-time socket listeners
  useEffect(() => {
    const socket = getSocket();

    const handleTaskCreated = (newTask: Task) => {
      if (newTask.projectId === currentProject?.id) {
        setTasks((prev) => [...prev, newTask]);
      }
    };

    const handleTaskMoved = (updatedTask: Task) => {
      if (updatedTask.projectId === currentProject?.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)).sort((a, b) => a.position - b.position)
        );
        if (selectedTask?.id === updatedTask.id) {
          setSelectedTask(updatedTask);
        }
      }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.projectId === currentProject?.id) {
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
        if (selectedTask?.id === updatedTask.id) {
          setSelectedTask(updatedTask);
        }
      }
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [currentProject, selectedTask]);

  const moveTask = async (taskId: string, newStatus: Task['status'], newPosition: number) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t)).sort((a, b) => a.position - b.position)
    );

    try {
      await api.put(`/tasks/${taskId}/move`, { status: newStatus, position: newPosition });
    } catch (err) {
      // Revert if API failed
      if (currentProject) selectProject(currentProject.id);
    }
  };

  const createTask = async (data: Partial<Task>) => {
    if (!currentProject) return;
    const res = await api.post('/tasks', { ...data, projectId: currentProject.id });
    setTasks((prev) => [...prev, res.data.task]);
  };

  const updateTask = async (taskId: string, data: Partial<Task>) => {
    const res = await api.put(`/tasks/${taskId}`, data);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...res.data.task } : t)));
    if (selectedTask?.id === taskId) {
      setSelectedTask(res.data.task);
    }
  };

  const deleteTask = async (taskId: string) => {
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        tasks,
        selectedTask,
        currentUserRole,
        loading,
        fetchProjects,
        selectProject,
        setSelectedTask,
        moveTask,
        createTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
