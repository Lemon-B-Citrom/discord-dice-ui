import { REQUEST_MSG_READY } from "../actions/roll.actions";

export default (store: any) => (next: any) => (action: any) => {
  if (action.type === REQUEST_MSG_READY) {
    const state = store.getState();
    const {
      userSettings: { hookUrl },
    } = state;
    const { msgTitle, color, fields, description } = action.payload;

    if (hookUrl) {
      const msg = {
        username: "Dice Roller",
        embeds: [
          {
            title: msgTitle,
            description,
            color,
            fields,
          },
        ],
      };

      const data = {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(msg),
      };

      // `fetch` can also throw synchronously (an unparsable URL), so the
      // promise chain alone is not enough to keep a bad webhook out of the
      // roll pipeline.
      try {
        fetch(hookUrl, data)
          .then((response) => {
            if (!response.ok) {
              console.error(
                `Discord webhook request failed with status ${response.status}.`
              );
            }
          })
          .catch(() => {
            console.error("Discord webhook request failed.");
          });
      } catch {
        console.error("Discord webhook request failed.");
      }
    }
  }
  return next(action);
};
