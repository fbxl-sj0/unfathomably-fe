import dotsVerticalIcon from '@tabler/icons/outline/dots-vertical.svg';
import hourglassEmptyIcon from '@tabler/icons/outline/hourglass-empty.svg';
import trashIcon from '@tabler/icons/outline/trash.svg';
import { useCallback, useState } from 'react';
import { useIntl, FormattedMessage, defineMessages } from 'react-intl';
import { Link } from 'react-router-dom';

import { closeReports } from '@/actions/admin.ts';
import { deactivateUserModal, deleteUserModal } from '@/actions/moderation.tsx';
import DropdownMenu from '@/components/dropdown-menu/index.ts';
import HoverRefWrapper from '@/components/hover-ref-wrapper.tsx';
import Accordion from '@/components/ui/accordion.tsx';
import Avatar from '@/components/ui/avatar.tsx';
import Button from '@/components/ui/button.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { makeGetReport } from '@/selectors/index.ts';
import toast from '@/toast.tsx';

import ReportStatus from './report-status.tsx';

import type { Account, AdminReport, Status } from '@/types/entities.ts';
import type { List as ImmutableList } from 'immutable';

const messages = defineMessages({
  reportClosed: { id: 'admin.reports.report_closed_message', defaultMessage: 'Report on @{name} was closed' },
  deactivateUser: { id: 'admin.users.actions.deactivate_user', defaultMessage: 'Deactivate @{name}' },
  deleteUser: { id: 'admin.users.actions.delete_user', defaultMessage: 'Delete @{name}' },
  unavailableAccount: { id: 'admin.reports.unavailable_account', defaultMessage: 'Deleted or unavailable account' },
});

interface IReport {
  id: string;
}

const Report: React.FC<IReport> = ({ id }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const getReport = useCallback(makeGetReport(), []);

  const report = useAppSelector((state) => getReport(state, id) as AdminReport | undefined);

  const [accordionExpanded, setAccordionExpanded] = useState(false);

  if (!report) return null;

  const account = report.account as Account | null;
  const targetAccount = report.target_account as Account | null;
  const accountId = account?.id;
  const targetAccountId = targetAccount?.id;
  const targetAcct = targetAccount?.acct;
  const reporterAcct = account?.acct;
  const unavailableAccount = intl.formatMessage(messages.unavailableAccount);
  const targetLabel = targetAcct ? `@${targetAcct}` : report.account_ap_id || unavailableAccount;
  const targetName = targetAccount?.username || targetAcct || report.account_ap_id || unavailableAccount;
  const reporterLabel = reporterAcct ? `@${reporterAcct}` : report.actor_ap_id || unavailableAccount;

  const makeMenu = () => {
    if (!targetAccountId || !targetAcct) return [];

    return [{
      text: intl.formatMessage(messages.deactivateUser, { name: targetAcct }),
      action: handleDeactivateUser,
      icon: hourglassEmptyIcon,
    }, {
      text: intl.formatMessage(messages.deleteUser, { name: targetAcct }),
      action: handleDeleteUser,
      icon: trashIcon,
      destructive: true,
    }];
  };

  const handleCloseReport = () => {
    dispatch(closeReports([report.id])).then(() => {
      const message = intl.formatMessage(messages.reportClosed, { name: targetName });
      toast.success(message);
    }).catch(() => {});
  };

  const handleDeactivateUser = () => {
    if (!targetAccountId) return;

    dispatch(deactivateUserModal(intl, targetAccountId, () => handleCloseReport()));
  };

  const handleDeleteUser = () => {
    if (!targetAccountId) return;

    dispatch(deleteUserModal(intl, targetAccountId, () => handleCloseReport()));
  };

  const handleAccordionToggle = (setting: boolean) => {
    setAccordionExpanded(setting);
  };

  const menu = makeMenu();
  const statuses = report.statuses as ImmutableList<Status>;
  const statusCount = statuses.count();

  return (
    <HStack space={3} className='p-3' key={report.id}>
      {targetAccountId && targetAcct ? (
        <HoverRefWrapper accountId={targetAccountId} inline>
          <Link to={`/@${targetAcct}`} title={targetAcct}>
            <Avatar src={targetAccount.avatar} size={32} className='overflow-hidden' />
          </Link>
        </HoverRefWrapper>
      ) : (
        <Avatar src='' size={32} className='overflow-hidden opacity-50' />
      )}

      <Stack space={3} className='overflow-hidden' grow>
        <Text tag='h4' weight='bold'>
          <FormattedMessage
            id='admin.reports.report_title'
            defaultMessage='Report on {acct}'
            values={{ acct: targetAccountId && targetAcct ? (
              <HoverRefWrapper accountId={targetAccountId} inline>
                <Link to={`/@${targetAcct}`} title={targetAcct}>@{targetAcct}</Link> {/* eslint-disable-line formatjs/no-literal-string-in-jsx */}
              </HoverRefWrapper>
            ) : targetLabel }}
          />
        </Text>

        {statusCount > 0 && (
          <Accordion
            headline={`Reported posts (${statusCount})`}
            expanded={accordionExpanded}
            onToggle={handleAccordionToggle}
          >
            <Stack space={4}>
              {statuses.map(status => (
                <ReportStatus
                  key={status.id}
                  report={report}
                  status={status}
                />
              ))}
            </Stack>
          </Accordion>
        )}

        <Stack>
          {(report.comment || '').length > 0 && (
            <Text
              tag='blockquote'
              dangerouslySetInnerHTML={{ __html: report.comment }}
            />
          )}

          <HStack space={1}>
            <Text theme='muted' tag='span'>&mdash;</Text> {/* eslint-disable-line formatjs/no-literal-string-in-jsx */}

            {accountId && reporterAcct ? (
              <HoverRefWrapper accountId={accountId} inline>
                <Link
                  to={`/@${reporterAcct}`}
                  title={reporterAcct}
                  className='text-primary-600 hover:underline dark:text-accent-blue'
                > {/* eslint-disable-line formatjs/no-literal-string-in-jsx */}
                  @{reporterAcct}
                </Link>
              </HoverRefWrapper>
            ) : (
              <Text theme='muted' tag='span'>{reporterLabel}</Text>
            )}
          </HStack>
        </Stack>
      </Stack>

      <HStack space={2} alignItems='start' className='flex-none'>
        <Button onClick={handleCloseReport}>
          <FormattedMessage id='admin.reports.actions.close' defaultMessage='Close' />
        </Button>

        {menu.length > 0 && <DropdownMenu items={menu} src={dotsVerticalIcon} />}
      </HStack>
    </HStack>
  );
};

export default Report;
