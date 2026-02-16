export function getEnv(platform: App.Platform | undefined): Env {
	if (!platform?.env) {
		throw new Error('Platform environment not available.');
	}
	return platform.env;
}
