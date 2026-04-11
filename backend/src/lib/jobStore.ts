import { activeJobs } from "../data/staticData.js";

/**
 * In-memory Job Store
 * Replaces the 'jobs' collection in Firestore
 */
class JobStore {
    private jobs: any[] = [...activeJobs];

    getJobs() {
        return [...this.jobs].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    getJobById(id: string) {
        return this.jobs.find(j => j.id === id);
    }

    addJob(job: any) {
        const id = `AJ-${Math.floor(Math.random() * 10000)}`;
        const newJob = { ...job, id };
        this.jobs.push(newJob);
        return newJob;
    }

    updateJob(id: string, updates: any) {
        const index = this.jobs.findIndex(j => j.id === id);
        if (index !== -1) {
            this.jobs[index] = { ...this.jobs[index], ...updates, updatedAt: new Date().toISOString() };
            return this.jobs[index];
        }
        return null;
    }
}

export const jobStore = new JobStore();
