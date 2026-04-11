import { syntheticDatasets, sampleTaxRecord } from "../data/staticData.js";

/**
 * In-memory Synthetic Data Store
 */
class SyntheticDataStore {
    private items: any[] = [...syntheticDatasets];
    private sample: any = { ...sampleTaxRecord };
    private previewPdf: string | null = null;

    getData() {
        return {
            items: this.items,
            sample: this.sample,
            previewPdf: this.previewPdf
        };
    }

    addDataset(dataset: any, sample: any, pdf: string) {
        this.items = [dataset, ...this.items].slice(0, 50);
        this.sample = sample;
        this.previewPdf = pdf;
        return dataset;
    }

    updateDataset(id: string, updates: any) {
        const index = this.items.findIndex(d => d.id === id);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...updates };
            return this.items[index];
        }
        return null;
    }

    getItems() {
        return this.items;
    }
}

export const syntheticDataStore = new SyntheticDataStore();
