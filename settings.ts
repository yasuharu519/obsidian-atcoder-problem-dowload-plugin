import { App, PluginSettingTab, Setting } from "obsidian";
import AtCoderProblemDownloadPlugin from "./main";

export interface AtCoderProblemDownloadPluginSettings {
	folderPath: string;
}

export const DEFAULT_SETTINGS: AtCoderProblemDownloadPluginSettings = {
	folderPath: "",
};

export class AtCoderProblemDownloadPluginSettingTab extends PluginSettingTab {
	plugin: AtCoderProblemDownloadPlugin;

	constructor(app: App, plugin: AtCoderProblemDownloadPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("folder path")
			.setDesc("Folder path to save the downloaded problems.")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.folderPath)
					.onChange(async (value) => {
						this.plugin.settings.folderPath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
