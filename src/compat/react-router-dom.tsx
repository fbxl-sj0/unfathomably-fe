import * as React from 'react';
import * as Router from 'react-router-dom-v7';

export * from 'react-router-dom-v7';

type Params = Record<string, string>;
type ParamsLike = Record<string, string | undefined>;
type PathInput = string | string[];
type To = Router.To;
type Action = Router.NavigationType;

interface Match<ParamType extends ParamsLike = Params> {
  params: ParamType;
  isExact: boolean;
  path: string;
  url: string;
}

interface RouteComponentProps<ParamType extends ParamsLike = any> {
  history: History;
  location: Router.Location;
  match: Match<ParamType>;
}

interface RouteProps {
  children?: React.ReactNode | ((props: RouteComponentProps) => React.ReactNode);
  component?: React.ComponentType<any> | React.ExoticComponent<any>;
  computedMatch?: Match;
  element?: React.ReactNode;
  exact?: boolean;
  location?: Router.Location;
  path?: PathInput;
  render?: (props: RouteComponentProps) => React.ReactNode;
  sensitive?: boolean;
  strict?: boolean;
}

interface RedirectProps {
  computedMatch?: Match;
  exact?: boolean;
  from?: PathInput;
  push?: boolean;
  sensitive?: boolean;
  strict?: boolean;
  to: To;
}

interface History {
  action: Action;
  block: () => () => void;
  go: (delta: number) => void;
  goBack: () => void;
  length: number;
  listen: (listener: HistoryListener) => () => void;
  location: Router.Location;
  push: (to: To, state?: unknown) => void;
  replace: (to: To, state?: unknown) => void;
}

type HistoryListener = (location: Router.Location, action: Action) => void;

type HistoryContextValue = {
  action: Action;
  listeners: React.MutableRefObject<Set<HistoryListener>>;
  location: Router.Location;
  navigate: ReturnType<typeof Router.useNavigate>;
};

const HistoryContext = React.createContext<HistoryContextValue | null>(null);
const MatchContext = React.createContext<Match | null>(null);

const BrowserRouter: React.FC<React.ComponentProps<typeof Router.BrowserRouter>> = ({ children, ...props }) => (
  <Router.BrowserRouter {...props}>
    <HistoryProvider>{children}</HistoryProvider>
  </Router.BrowserRouter>
);

const MemoryRouter: React.FC<React.ComponentProps<typeof Router.MemoryRouter>> = ({ children, ...props }) => (
  <Router.MemoryRouter {...props}>
    <HistoryProvider>{children}</HistoryProvider>
  </Router.MemoryRouter>
);

const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const action = Router.useNavigationType();
  const location = Router.useLocation();
  const navigate = Router.useNavigate();
  const listeners = React.useRef<Set<HistoryListener>>(new Set());
  const previousKey = React.useRef(location.key);

  React.useEffect(() => {
    if (previousKey.current === location.key) {
      return;
    }

    previousKey.current = location.key;
    listeners.current.forEach(listener => listener(location, action));
  }, [action, location]);

  const value = React.useMemo<HistoryContextValue>(() => ({
    action,
    listeners,
    location,
    navigate,
  }), [action, location, navigate]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

const buildStateOptions = (state?: unknown) => state === undefined ? undefined : { state };

const useHistory = (): History => {
  const context = React.useContext(HistoryContext);

  if (!context) {
    throw new Error('useHistory() must be used inside a Router.');
  }

  const { action, listeners, location, navigate } = context;

  return React.useMemo<History>(() => ({
    action,
    block: () => () => undefined,
    go: (delta: number) => {
      navigate(delta);
    },
    goBack: () => {
      navigate(-1);
    },
    get length() {
      return window.history.length;
    },
    listen: (listener: HistoryListener) => {
      listeners.current.add(listener);
      return () => {
        listeners.current.delete(listener);
      };
    },
    location,
    push: (to: To, state?: unknown) => {
      navigate(to, buildStateOptions(state));
    },
    replace: (to: To, state?: unknown) => {
      navigate(to, { ...buildStateOptions(state), replace: true });
    },
  }), [action, listeners, location, navigate]);
};

const Link = Router.Link;
const useNavigate = Router.useNavigate;

const useLocation = <State = unknown>(): Router.Location<State> => (
  Router.useLocation() as Router.Location<State>
);

const useParams = <ParamType = Params>(): ParamType => (
  Router.useParams() as ParamType
);

interface NavLinkProps extends Omit<React.ComponentProps<typeof Router.NavLink>, 'end'> {
  exact?: boolean;
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ exact, ...props }, ref) => (
  <Router.NavLink ref={ref} end={exact} {...props} />
));

const Switch: React.FC<{ children?: React.ReactNode; location?: Router.Location }> = ({ children, location: locationProp }) => {
  const currentLocation = Router.useLocation();
  const location = locationProp ?? currentLocation;
  let element: React.ReactElement | null = null;
  let elementMatch: Match | null = null;

  React.Children.forEach(children, child => {
    if (element || !React.isValidElement(child)) {
      return;
    }

    const props = child.props as RouteProps & RedirectProps;
    const path = props.path ?? props.from;
    const match = path
      ? matchPath(location.pathname, {
        exact: props.exact,
        path,
        sensitive: props.sensitive,
        strict: props.strict,
      })
      : createRootMatch(location.pathname);

    if (match) {
      element = React.cloneElement(child, { computedMatch: match, location } as Partial<RouteProps & RedirectProps>);
      elementMatch = match;
    }
  });

  if (!element || !elementMatch) {
    return null;
  }

  return (
    <MatchContext.Provider value={elementMatch}>
      {element}
    </MatchContext.Provider>
  );
};

const Route: React.FC<RouteProps> = ({
  children,
  component: Component,
  computedMatch,
  element,
  exact,
  location: locationProp,
  path,
  render,
  sensitive,
  strict,
}) => {
  const history = useHistory();
  const currentLocation = Router.useLocation();
  const location = locationProp ?? currentLocation;
  const match = computedMatch ?? (path
    ? matchPath(location.pathname, { exact, path, sensitive, strict })
    : createRootMatch(location.pathname));

  if (!match) {
    return null;
  }

  const routeProps: RouteComponentProps = { history, location, match };
  let rendered: React.ReactNode;

  if (element !== undefined) {
    rendered = element;
  } else if (Component) {
    rendered = <Component {...routeProps} />;
  } else if (render) {
    rendered = render(routeProps);
  } else if (typeof children === 'function') {
    rendered = children(routeProps);
  } else {
    rendered = children;
  }

  return (
    <MatchContext.Provider value={match}>
      {rendered}
    </MatchContext.Provider>
  );
};

const Redirect: React.FC<RedirectProps> = ({
  computedMatch,
  exact,
  from,
  push,
  sensitive,
  strict,
  to,
}) => {
  const location = Router.useLocation();
  const match = computedMatch ?? (from
    ? matchPath(location.pathname, { exact, path: from, sensitive, strict })
    : createRootMatch(location.pathname));

  if (!match) {
    return null;
  }

  return <Router.Navigate to={interpolateTo(to, match.params)} replace={!push} />;
};

function useRouteMatch<ParamType extends ParamsLike = Params>(): Match<ParamType>;
function useRouteMatch<ParamType extends ParamsLike = Params>(path: PathInput): Match<ParamType> | null;
function useRouteMatch<ParamType extends ParamsLike = Params>(path?: PathInput): Match<ParamType> | null {
  const location = Router.useLocation();
  const routeMatch = React.useContext(MatchContext);

  if (path) {
    return matchPath(location.pathname, { path }) as Match<ParamType> | null;
  }

  return routeMatch as Match<ParamType> | null ?? createRootMatch(location.pathname) as Match<ParamType>;
}

interface MatchPathOptions {
  exact?: boolean;
  path?: PathInput;
  sensitive?: boolean;
  strict?: boolean;
}

const matchPath = <ParamType extends ParamsLike = Params>(
  pathname: string,
  options: MatchPathOptions | PathInput,
): Match<ParamType> | null => {
  const normalizedOptions = typeof options === 'string' || Array.isArray(options)
    ? { path: options }
    : options;

  const paths = Array.isArray(normalizedOptions.path)
    ? normalizedOptions.path
    : [normalizedOptions.path ?? pathname];

  for (const path of paths) {
    const compiled = compilePath(path, normalizedOptions);
    const match = compiled.regex.exec(pathname);

    if (!match) {
      continue;
    }

    const url = match[0] || '/';
    const normalizedUrl = normalizeMatchedUrl(url);
    const isExact = normalizeComparablePath(pathname) === normalizeComparablePath(normalizedUrl);

    if (normalizedOptions.exact && !isExact) {
      continue;
    }

    return {
      params: compiled.keys.reduce<Params>((params, key, index) => {
        params[key] = decodeURIComponent(match[index + 1] ?? '');
        return params;
      }, {}) as ParamType,
      isExact,
      path,
      url: normalizedUrl,
    };
  }

  return null;
};

const createRootMatch = (pathname: string): Match => ({
  params: {},
  isExact: pathname === '/',
  path: '/',
  url: pathname || '/',
});

const normalizeMatchedUrl = (url: string): string => {
  if (url.length > 1 && url.endsWith('/')) {
    return url.slice(0, -1);
  }

  return url;
};

const normalizeComparablePath = (path: string): string => {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
};

const compilePath = (path: string, options: MatchPathOptions) => {
  if (path === '/') {
    return {
      keys: [],
      regex: new RegExp(options.exact ? '^/?$' : '^/', options.sensitive ? '' : 'i'),
    };
  }

  const keys: string[] = [];
  const segments = path.split('/').slice(1);
  let source = '^';

  segments.forEach(segment => {
    if (segment === '*') {
      keys.push('*');
      source += '(?:/(.*))?';
      return;
    }

    if (segment.startsWith(':') && segment.endsWith('?')) {
      source += `(?:/${compileSegment(segment.slice(0, -1), keys)})?`;
      return;
    }

    source += `/${compileSegment(segment, keys)}`;
  });

  if (options.exact) {
    source += options.strict ? '$' : '/?$';
  } else {
    source += options.strict ? '(?=/|$)' : '/?(?=/|$)';
  }

  return {
    keys,
    regex: new RegExp(source, options.sensitive ? '' : 'i'),
  };
};

const compileSegment = (segment: string, keys: string[]): string => {
  let source = '';

  for (let index = 0; index < segment.length; index++) {
    const char = segment[index];

    if (char !== ':') {
      source += escapeRegex(char);
      continue;
    }

    let name = '';
    index++;

    while (index < segment.length && /[A-Za-z0-9_]/.test(segment[index])) {
      name += segment[index];
      index++;
    }

    let pattern = '[^/]+';

    if (segment[index] === '(') {
      const start = index;
      let depth = 0;

      while (index < segment.length) {
        if (segment[index] === '(') {
          depth++;
        } else if (segment[index] === ')') {
          depth--;

          if (depth === 0) {
            break;
          }
        }

        index++;
      }

      pattern = segment.slice(start + 1, index);
    } else {
      index--;
    }

    keys.push(name);
    source += `(${pattern})`;
  }

  return source;
};

const escapeRegex = (value: string): string => value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

const interpolateTo = (to: To, params: Params): To => {
  if (typeof to === 'string') {
    return interpolatePath(to, params);
  }

  return {
    ...to,
    pathname: to.pathname ? interpolatePath(to.pathname, params) : to.pathname,
  };
};

const interpolatePath = (path: string, params: Params): string => (
  path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => encodeURIComponent(params[key] ?? ''))
);

export {
  BrowserRouter,
  Link,
  MemoryRouter,
  NavLink,
  Redirect,
  Route,
  Switch,
  matchPath,
  useHistory,
  useLocation,
  useNavigate,
  useParams,
  useRouteMatch,
};

export type {
  History,
  Match as match,
  Match,
  RouteComponentProps,
  RouteProps,
};
