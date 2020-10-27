import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useHistory, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PageTitle from '../../components/PageTitle';
import PlayerTag from '../../components/PlayerTag';
import Selector from '../../components/Selector';
import Table from '../../components/Table';
import NumberLabel from '../../components/NumberLabel';
import TablePlaceholder from '../../components/TablePlaceholder';
import { PLAYER_BUILDS, ALL_METRICS } from '../../config';
import { getPlayerBuild, getMetricIcon, getMetricName, isSkill, isBoss } from '../../utils';
import fetchLeaderboard from '../../redux/modules/deltas/actions/fetchLeaderboard';
import {
  getLeaderboards,
  isFetchingDay,
  isFetchingWeek,
  isFetchingMonth
} from '../../redux/selectors/deltas';
import './Top.scss';

function getTableConfig(metric, period) {
  return {
    uniqueKey: row => row.player.username,
    columns: [
      {
        key: 'rank',
        width: '30',
        transform: rank => <span className="top-rank">{rank}</span>
      },
      {
        key: 'displayName',
        get: row => row.player.displayName,
        className: () => '-primary',
        transform: (value, row) => (
          <Link to={getPlayerURL(row.player.username, metric, period)}>
            <PlayerTag name={value} type={row.player.type} flagged={row.player.flagged} />
          </Link>
        )
      },
      {
        key: 'gained',
        width: 90,
        transform: val => <NumberLabel value={val} isColored />
      }
    ]
  };
}

function getPlayerBuildOptions() {
  const options = PLAYER_BUILDS.filter(build => build !== 'f2p').map(build => ({
    label: getPlayerBuild(build),
    value: build
  }));

  return [{ label: 'All player builds', value: null }, ...options];
}

function getMetricOptions() {
  return ALL_METRICS.map(metric => ({
    label: getMetricName(metric),
    icon: getMetricIcon(metric, true),
    value: metric
  }));
}

function useQuery(keys) {
  const urlQuery = new URLSearchParams(useLocation().search);
  const result = {};

  keys.forEach(k => {
    result[k] = urlQuery.get(k);
  });

  return result;
}

function getPlayerURL(username, metric, period) {
  let section = '';

  if (isSkill(metric) || metric === 'ehp') {
    section = 'skilling';
  } else if (isBoss(metric) || metric === 'ehb') {
    section = 'bossing';
  } else {
    section = 'activities';
  }

  return `/players/${username}/gained/${section}/?metric=${metric}&period=${period}`;
}

function getNextUrl(nextMetric, nextBuild) {
  const baseUrl = `/top/${nextMetric}?`;
  const queries = [];

  if (nextBuild !== null) {
    queries.push(`build=${nextBuild}`);
  }

  return `${baseUrl}${queries.join('&')}`;
}

function Top() {
  const router = useHistory();
  const dispatch = useDispatch();
  const { metric } = useParams();
  const { build } = useQuery(['build']);

  const selectedMetric = metric || 'overall';
  const selectedPlayerBuild = build || null;

  const metricOptions = useMemo(() => getMetricOptions(), []);
  const playerBuildOptions = useMemo(() => getPlayerBuildOptions(), []);

  const metricIndex = metricOptions.findIndex(o => o.value === selectedMetric);
  const playerBuildIndex = playerBuildOptions.findIndex(o => o.value === selectedPlayerBuild);

  // Memoized redux variables
  const leaderboards = useSelector(getLeaderboards);
  const isLoadingDay = useSelector(isFetchingDay);
  const isLoadingWeek = useSelector(isFetchingWeek);
  const isLoadingMonth = useSelector(isFetchingMonth);

  const reloadList = () => {
    const periods = ['day', 'week', 'month'];

    periods.forEach(p => {
      dispatch(fetchLeaderboard(selectedMetric, p, 'ironman', selectedPlayerBuild));
    });
  };

  const handleMetricSelected = e => {
    if (!e || !e.value) return;
    router.push(getNextUrl(e.value, selectedPlayerBuild));
  };

  const handleBuildSelected = e => {
    router.push(getNextUrl(selectedMetric, e.value));
  };

  const dayTableConfig = useMemo(() => getTableConfig(selectedMetric, 'day'), [selectedMetric]);
  const weekTableConfig = useMemo(() => getTableConfig(selectedMetric, 'week'), [selectedMetric]);
  const monthTableConfig = useMemo(() => getTableConfig(selectedMetric, 'month'), [selectedMetric]);

  useEffect(reloadList, [selectedMetric, selectedPlayerBuild]);

  return (
    <div className="top__container container">
      <Helmet>
        <title>{`${getMetricName(selectedMetric)} current top`}</title>
      </Helmet>
      <div className="top__header row">
        <div className="col">
          <PageTitle title="Current Top" />
        </div>
      </div>
      <div className="top__filters row">
        <div className="col-lg-4 col-md-6">
          <Selector
            options={metricOptions}
            selectedIndex={metricIndex}
            onSelect={handleMetricSelected}
            search
          />
        </div>
        <div className="col-lg-3 col-md-5">
          {new Date() > new Date('2020-08-20') && (
            <Selector
              options={playerBuildOptions}
              selectedIndex={playerBuildIndex}
              onSelect={handleBuildSelected}
            />
          )}
        </div>
      </div>
      <div className="top__list row">
        <div className="col-lg-4 col-md-6">
          <h3 className="period-label">Day</h3>
          {isLoadingDay && <img className="loading-icon" src="/img/icons/loading.png" alt="" />}
          {!leaderboards || !leaderboards.day ? (
            <TablePlaceholder size={20} />
          ) : (
            <Table
              uniqueKeySelector={dayTableConfig.uniqueKey}
              columns={dayTableConfig.columns}
              rows={leaderboards.day}
              listStyle
            />
          )}
        </div>
        <div className="col-lg-4 col-md-6">
          <h3 className="period-label">Week</h3>
          {isLoadingWeek && <img className="loading-icon" src="/img/icons/loading.png" alt="" />}
          {!leaderboards || !leaderboards.week ? (
            <TablePlaceholder size={20} />
          ) : (
            <Table
              uniqueKeySelector={weekTableConfig.uniqueKey}
              columns={weekTableConfig.columns}
              rows={leaderboards.week}
              listStyle
            />
          )}
        </div>
        <div className="col-lg-4 col-md-6">
          <h3 className="period-label">Month</h3>
          {isLoadingMonth && <img className="loading-icon" src="/img/icons/loading.png" alt="" />}
          {!leaderboards || !leaderboards.month ? (
            <TablePlaceholder size={20} />
          ) : (
            <Table
              uniqueKeySelector={monthTableConfig.uniqueKey}
              columns={monthTableConfig.columns}
              rows={leaderboards.month}
              listStyle
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Top;
