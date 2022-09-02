import React from "react";
import AccountsSDK from "@livechat/accounts-sdk";
import createRequests from "./requests";
import Chart from "./Chart";
import * as dayjs from "dayjs";
import {
  InputField,
  Button,
  Loader,
  ProgressBar,
} from "@livechat/design-system";

const generateLabels = (dateFrom, dateTo, resolution = "month") => {
  let current = dateTo;
  let dateFormat = "YYYY-MM";
  const formatedFrom = dayjs(dateFrom).format(dateFormat);
  let substractUnit = resolution;
  if (resolution === "day") {
    dateFormat = "YYYY-MM-DD";
  }
  const res = [dayjs(dateTo).format(dateFormat)];
  while (dayjs(current).format(dateFormat) !== formatedFrom) {
    current = dayjs(current).subtract(1, substractUnit);
    let formatedCurrent = dayjs(current).format(dateFormat);
    res.push(formatedCurrent);
  }
  return res;
};

const parseData = (labels, data) => {
  const result = labels.map((month) => ({
    x: month,
    y: 0,
  }));
  data.forEach((chat) => {
    const month = dayjs(chat.thread.created_at).format("YYYY-MM");
    const monthData = result.find((_month) => _month.x === month);
    monthData.y = monthData.y + 1;
  });
  return result;
};

function App() {
  const accountsClient = React.useRef(null);
  const [env, setEnv] = React.useState(null);
  const requestsClient = React.useRef(null);
  const [fetching, setFetching] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [chartData, setChartData] = React.useState(null);
  const [pendingProgress, setPendingProgress] = React.useState(null);
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    if (!token) {
      return;
    }
    requestsClient.current = createRequests(token, env);
  }, [env, token]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const labs = urlParams.get("labs");
    setEnv(labs ? "labs" : "prod");
    const accountsData = {
      pkce: {
        enabled: false,
      },
      client_id: labs
        ? process.env.REACT_APP_LABS_CLIENT_ID
        : process.env.REACT_APP_CLIENT_ID,
    };
    if (labs) {
      accountsData.server_url =
        process.env.REACT_APP_LABS_ACCOUNTS_BACKEND_ADDRESS;
    }

    const sdk = new AccountsSDK(accountsData);
    sdk
      .redirect()
      .authorizeData()
      .then((authorizeData) => {
        const token = authorizeData.access_token;
        setToken(token);
        sdk.verify(authorizeData);
      })
      .catch((e) => {
        // authorize data missing, redirect to authorization server
        console.warn("redirect");
        sdk.redirect().authorize();
      });
    accountsClient.current = sdk;
  }, []);
  const handleCheckClick = React.useCallback(() => {
    if (!requestsClient.current) {
      return;
    }
    setFetching(true);
    const query = searchValue.trim();
    requestsClient.current
      .run(query, (data) => {
        setPendingProgress(data);
      })
      .then((data) => {
        setPendingProgress(null);
        setFetching(false);

        const earliest = data[data.length - 1].thread.created_at;
        const labels = generateLabels(earliest, Date.now());
        const _chartData = parseData(labels, data);
        setChartData({
          query,
          parsed: _chartData.reverse(),
          total: data.length,
        });
      })
      .catch(() => {
        setPendingProgress(null);
        setFetching(false);
      });
  }, [searchValue]);
  return (
    <div className="App" style={{ padding: "20px", maxWidth: "900px" }}>
      <h1>Trends Finder</h1>
      <div style={{ display: "flex" }}>
        {token && (
          <>
            <InputField
              id="query"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <div style={{ marginLeft: "10px" }}>
              <Button onClick={handleCheckClick}>Check</Button>
            </div>
          </>
        )}
        {!token && <div>Authotrizing...</div>}
      </div>
      {!pendingProgress && fetching && <Loader />}
      {pendingProgress && (
        <ProgressBar
          percent={(pendingProgress.done / pendingProgress.pages) * 100}
        />
      )}
      {chartData && (
        <div>
          <p>
            Results for <strong>{chartData.query}</strong>. Found{" "}
            <strong>{chartData.total}</strong> chats.
          </p>
          <Chart data={chartData.parsed} />
        </div>
      )}
    </div>
  );
}

export default App;
