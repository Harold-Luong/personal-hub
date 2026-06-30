import AmountText from "../shared/AmountText";
import { getBalanceTrendVisual } from "../../utils/getBalanceTrendVisual";

export default function BalanceHeroCard({
    balance = 0,
    balanceTrend = -10,
    expense = 0,
    expenseTrend = 0,
    income = 0,
    incomeTrend = 0,
}) {
    const {
        direction: balanceTrendDirection,
        symbol: balanceTrendSymbol,
        sparklinePath,
        sparklineEndY,
    } = getBalanceTrendVisual(balanceTrend);
    const { direction: incomeTrendDirection, symbol: incomeTrendSymbol } = getBalanceTrendVisual(incomeTrend);
    const { direction: expenseTrendDirection, symbol: expenseTrendSymbol } = getBalanceTrendVisual(expenseTrend);

    return (
        <section className="balance-hero-card">
            <div className="balance-hero-card__main">
                <div className="balance-hero-card__content">
                    <p>Tổng số dư</p>
                    <strong>
                        <AmountText amount={balance} />
                    </strong>
                    <span className="balance-hero-card__comparison">
                        <b className={balanceTrendDirection}>
                            {balanceTrendSymbol} {Math.abs(balanceTrend)}%
                        </b>{" "}
                        so với tháng trước
                    </span>
                </div>

                <svg
                    aria-hidden="true"
                    className={`balance-hero-card__sparkline ${balanceTrendDirection}`}
                    viewBox="0 0 80 52"
                >
                    <path d={sparklinePath} />
                    <circle cx="76" cy={sparklineEndY} r="3" />
                </svg>
            </div>

            <div className="balance-hero-card__split">
                <div className="balance-hero-card__item">
                    <p>Tổng thu</p>
                    <strong>
                        <AmountText amount={income} />
                    </strong>
                    <span className={`balance-hero-card__trend ${incomeTrendDirection}`}>
                        {incomeTrendSymbol} {Math.abs(incomeTrend)}%
                    </span>
                </div>

                <div className="balance-hero-card__item">
                    <p>Tổng chi</p>
                    <strong>
                        <AmountText amount={Math.abs(expense)} />
                    </strong>
                    <span
                        className={`balance-hero-card__trend balance-hero-card__trend--expense ${expenseTrendDirection}`}
                    >
                        {expenseTrendSymbol} {Math.abs(expenseTrend)}%
                    </span>
                </div>
            </div>
        </section>
    );
}
