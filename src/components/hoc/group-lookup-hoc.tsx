/*
  Project: Unfathomably FE
  File: components/hoc/group-lookup-hoc.tsx

  Purpose:
    Resolve public group slugs before rendering group routes.

  Responsibilities:
    Look up /group/:groupSlug routes through the group lookup API and pass the
    resolved group id to group pages that still expect params.groupId.

  This file intentionally does NOT contain:
    Group page rendering or group API mutation logic.
*/

import { useRouteMatch } from 'react-router-dom';

import { useGroupLookup } from '@/api/hooks/index.ts';
import Layout from '@/components/ui/layout.tsx';
import ColumnLoading from '@/features/ui/components/column-loading.tsx';

interface IGroupRouteParams {
  groupId?: string;
  groupSlug?: string;
  [key: string]: string | undefined;
}

interface IGroupRouteProps {
  params?: IGroupRouteParams;
}

/** Wrap a group route component so singular /group/:slug URLs resolve to ids. */
function withGroupLookup<P extends IGroupRouteProps>(Component: React.ExoticComponent<P>): React.ExoticComponent<P> {
  const GroupLookup: React.FC<P> = (props) => {
    const groupMatch = useRouteMatch<IGroupRouteParams>('/group/:groupSlug');
    const groupsMatch = useRouteMatch<IGroupRouteParams>('/groups/:groupId');
    const params = { ...(groupMatch?.params || {}), ...(groupsMatch?.params || {}), ...(props.params || {}) };
    const groupSlug = params.groupSlug || '';
    const { entity: group } = useGroupLookup(groupSlug);

    if (params.groupId) {
      return <Component {...props} />;
    }

    if (!group) {
      return (
        <>
          <Layout.Main>
            <ColumnLoading />
          </Layout.Main>

          <Layout.Aside />
        </>
      );
    }

    const nextProps = {
      ...props,
      params: {
        ...params,
        groupId: group.id,
      },
    } as P;

    return <Component {...nextProps} />;
  };

  return GroupLookup as React.ExoticComponent<P>;
}

export default withGroupLookup;

/* end of components/hoc/group-lookup-hoc.tsx */
