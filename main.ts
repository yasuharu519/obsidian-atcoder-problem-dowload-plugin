import { Editor, MarkdownView, Plugin, requestUrl } from "obsidian";
import cheerio, { Element } from "cheerio";
import {
	DEFAULT_SETTINGS,
	AtCoderProblemDownloadPluginSettings,
	AtCoderProblemDownloadPluginSettingTab,
} from "./settings";

// Remember to rename these classes and interfaces!

export default class AtCoderProblemDownloadPlugin extends Plugin {
	settings: AtCoderProblemDownloadPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "download-atcoder-problem",
			name: "Download AtCoder Problem",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());

				const url = "<URL>";
				console.log("Downloading from", url);
				const content = (await this.downloadAndParseHTML(url)) ?? "";
				console.log(content);
				editor.replaceSelection(content);
			},
		});

		this.addSettingTab(
			new AtCoderProblemDownloadPluginSettingTab(this.app, this)
		);
	}

	async downloadAndParseHTML(url: string) {
		try {
			const response = await requestUrl(url);
			console.log("Response:", response);
			const $ = cheerio.load(response.text);

			// Extract title
			const title = $("title").text();
			let content = `# ${title}\n\n`;

			const lang_ja = $(".lang-ja");
			lang_ja.find(".part").each((_, elem) => {
				content += this.parseAndGetContentFromPart(elem);
			});

			return content;
		} catch (error) {
			console.error("Error downloading or parsing HTML:", error);
		}
	}

	parseAndGetContentFromPart(elem: Element): string {
		const $ = cheerio.load(elem);
		const part = $(elem);
		const sectionMaybe = part.find("section");
		if (sectionMaybe.length == 0) {
			return "";
		}
		const section = sectionMaybe.first();
		const children = section.children();

		let header = "";
		let content = "";

		children.each((_, elem) => {
			const child = $(elem);
			if (child.is("h3")) {
				header = child.text();
			} else if (child.is("p")) {
				child.find("var").each((_, varelem) => {
					$(varelem).replaceWith(`$${$(varelem).text()}$`);
				});
				content += child.text() + "\n";
			} else if (child.is("ul")) {
				child.find("li").each((_, lielem) => {
					$(lielem)
						.find("var")
						.each((_, varelem) => {
							$(varelem).replaceWith(`$${$(varelem).text()}$`);
						});
					content += `- ${$(lielem).text()}\n`;
				});
				content += "\n";
			} else if (child.is("pre")) {
				content += "```\n";
				content += child.text();
				content += "```\n";
			} else if (child.is("details")) {
				const summary = child.find("summary").text();
				content += `> [!info]- ${summary}\n`;
				child.find("var").each((_, varelem) => {
					$(varelem).replaceWith(`$${$(varelem).text()}$`);
				});

				// TODO: ul, li タグの処理

				const childContent = child.text();
				childContent.split("\n").forEach((line) => {
					content += `> ${line}\n`;
				});
				content += "\n";
			}
		});

		if (header !== "") {
			return `## ${header}\n\n${content}\n`;
		} else {
			return content;
		}
	}

	onunload() {
		console.log("unloading plugin");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
