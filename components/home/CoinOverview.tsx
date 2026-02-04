import { fetcher } from '@/lib/coingecko.actions';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { CoinOverviewFallback } from './fallback';
import CandlestickChart from '@/components/CandlestickChart';

const CoinOverview = async () => {
	let coin;
	let coinOHLCData;

	try {
		const result = await Promise.all([
			fetcher<CoinDetailsData>('/coins/bitcoin'),
			fetcher<OHLCData[]>('/coins/bitcoin/ohlc', {
				vs_currency: 'usd',
				days: 1
			}),
		]);
		coin = result[0];
		coinOHLCData = result[1];
	} catch (error) {
		console.error('Error fetching coin overview:', error);
		return <CoinOverviewFallback />;
	}

	// El JSX está FUERA del try/catch
	return (
		<div id="coin-overview">
			<CandlestickChart data={coinOHLCData} coinId="bitcoin">
				<div className="header pt-2">
					<Image src={coin.image.large} alt={coin.name} width={56} height={56} />
					<div className="info">
						<p>
							{coin.name} / {coin.symbol.toUpperCase()}
						</p>
						<h1>{formatCurrency(coin.market_data.current_price.usd)}</h1>
					</div>
				</div>
			</CandlestickChart>
		</div>
	);
};

export default CoinOverview;