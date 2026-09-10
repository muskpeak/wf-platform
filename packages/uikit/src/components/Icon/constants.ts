import type { IconNameType } from './type';
import { HomeIcon } from './icons/HomeIcon';
import { WorldLottoIcon } from './icons/WorldLottoIcon';
import { ThreeDIcon } from './icons/ThreeDIcon';
import { ProfileIcon } from './icons/ProfileIcon';
import { HomeIconActive } from './icons/HomeIconActive';
import { WorldLottoIconActive } from './icons/WorldLottoIconActive';
import { ThreeDIconActive } from './icons/ThreeDIconActive';
import { ProfileIconActive } from './icons/ProfileIconActive';
import { DepositIcon } from './icons/DepositIcon';
import { WithdrawIcon } from './icons/WithdrawIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { GlobalIcon } from './icons/GlobalIcon';
import { CardSearchIcon } from './icons/CardSearchIcon';
import { WalletMoneyIcon } from './icons/WalletMoneyIcon';

export const iconCache: Record<IconNameType, any> = {
  home: HomeIcon,
  home_active: HomeIconActive,
  world_lotto: WorldLottoIcon,
  world_lotto_active: WorldLottoIconActive,
  three_d: ThreeDIcon,
  three_d_active: ThreeDIconActive,
  profile: ProfileIcon,
  profile_active: ProfileIconActive,
  deposit: DepositIcon,
  withdraw: WithdrawIcon,
  logout: LogoutIcon,
  global: GlobalIcon,
  card_search: CardSearchIcon,
  wallet: WalletMoneyIcon,
};
