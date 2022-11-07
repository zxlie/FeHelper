/**
 * FeHelper 贷款计算器工具
 * @author zhaoxianlie
 */
new Vue({
    el: '#containerPayback',
    data: {
        money: 10000,
        months: 12,
        yearRate: 24,
        paybackMode: 1,
        billList: [],
        formula: {
            "1": '等额本息：月供=贷款本金×[年化利率÷12×(1+年化利率÷12) ^ 还款月数]÷{[(1+年化利率÷12) ^ 还款月数]-1}',
            "2": '等额本金：月供=贷款本金÷还款月数x(1+年化利率÷12x剩余还款期数)'
        },

        calcMode: 'rate',
        calcModeText: {
            'rate': '实际年化反推',
            'loan': '月供账单计算'
        },

        revRate: 0,
        revMoney: 10000,
        revAllAmount: 11347.20,
        revAllInterest: 0
    },

    mounted: function () {
        // 进制转换的初始化
        this.paybackConvert();
    },

    methods: {

        paybackConvert: function () {

            this.$nextTick(() => {

                if (!this.dataCheck()) {
                    return;
                }

                if (this.calcMode === 'rate') {
                    if (parseInt(this.paybackMode) === 1) {
                        this.avgCapitalPlusInterest();
                    } else {
                        this.avgCapitalOnly();
                    }
                } else {
                    this.revCalcYearRate();
                }

            });
        },

        /**
         * 数据合法性校验
         */
        dataCheck: function () {
            if (!this.money || !/\d|\./.test(this.money) || parseInt(this.money) <= 0) {
                alert('请输入正确的贷款金额！');
                return false;
            }
            if (!this.months || /\D/.test(this.months) || parseInt(this.months) <= 0) {
                alert('请输入正确的贷款期限！');
                return false;
            }
            if (parseInt(this.months) > 360) {
                alert('在哪儿能贷30年？');
                return false;
            }

            if (this.calcMode === 'rate') {
                if (!this.yearRate || !/\d|\./.test(this.yearRate) || parseFloat(this.yearRate) <= 0) {
                    alert('请输入正确的贷款年化利率！');
                    return false;
                }
            } else {
                if (!this.revAllAmount || !/\d|\./.test(this.revAllAmount) || parseInt(this.revAllAmount) <= 0) {
                    alert('请输入正确的总还款额！');
                    return false;
                }
                if(parseInt(this.revAllAmount) < parseInt(this.money)) {
                    alert('还款总额比贷款本金还低，这种情况就不用算了吧。。。');
                    return false;
                }
            }

            return true;
        },

        /**
         * 等额本息计算方式
         * 每月还款额=贷款本金×[月利率×(1+月利率) ^ 还款月数]÷{[(1+月利率) ^ 还款月数]-1}
         */
        avgCapitalPlusInterest: function () {

            let rate = this.yearRate / 12 / 100;
            let mRate = Math.pow(rate + 1, this.months);

            // 每月账单金额
            let bill = Math.round(this.money * rate * mRate / (mRate - 1) * 100) / 100;

            // 累计还款额
            let allBillsAmount = bill * this.months;
            // 总利息
            let allInterest = allBillsAmount - this.money;

            // 剩余本金
            let leftOver = this.money;
            // 剩余利息
            let leftInterest = allInterest;
            // 剩余期限
            let leftTime = this.months;
            // 每期利息
            let interest = 0;
            // 每期本金
            let amount = 0;

            // 累计数据先入队
            this.billList = [{
                name: '合计',
                amount: Number(this.money).toFixed(2),
                interest: (Math.round(allInterest * 100) / 100).toFixed(2),
                bill: (Math.round(allBillsAmount * 100) / 100).toFixed(2),
                totalAmount: '-',
                totalInterest: '-',
                leftOver: (Math.round(leftOver * 100) / 100).toFixed(2),
                leftInterest: (Math.round(allInterest * 100) / 100).toFixed(2)
            }];

            // 生成账单列表
            for (; leftTime > 0; leftTime--) {

                mRate = Math.pow(rate + 1, leftTime || 0);

                // 特殊处理最后一期
                if (leftTime === 1) {
                    interest = leftInterest;
                    amount = leftOver;
                } else {
                    // 月供利息
                    interest = leftOver * rate;
                    // 月供本金
                    amount = bill - interest;
                }

                leftOver -= amount;
                leftInterest -= interest;

                this.billList.push({
                    name: `第${this.months - leftTime + 1}期`,
                    amount: (Math.round(amount * 100) / 100).toFixed(2),
                    interest: (Math.round(interest * 100) / 100).toFixed(2),
                    bill: (Math.round(bill * 100) / 100).toFixed(2),
                    totalAmount: (Math.round((this.money - leftOver) * 100) / 100).toFixed(2),
                    totalInterest: (Math.round((allInterest - leftInterest) * 100) / 100).toFixed(2),
                    leftOver: (Math.round(leftOver * 100) / 100).toFixed(2),
                    leftInterest: (Math.round(leftInterest * 100) / 100).toFixed(2)
                });
            }
        },


        /**
         * 等额本金还款公式
         *
         * 月供本金=贷款本金÷还款月数
         * 月供利息=月供本金×月利率x剩余还款期数
         * 月供总额=月供本金+月供利率 = 贷款本金÷还款月数x(1+月利率x剩余还款期数)
         *
         */
        avgCapitalOnly: function () {

            let rate = this.yearRate / 12 / 100;
            let amount = this.money / this.months;
            let deltaInterest = amount * rate;
            let allBillsAmount = (amount + this.money * rate + amount * (1 + rate)) / 2 * this.months;
            let allInterest = allBillsAmount - this.money;

            // 剩余本金
            let leftOver = this.money;
            // 剩余利息
            let leftInterest = allInterest;

            // 累计数据先入队
            this.billList = [{
                name: '合计',
                amount: Number(this.money).toFixed(2),
                interest: (Math.round(allInterest * 100) / 100).toFixed(2),
                bill: (Math.round(allBillsAmount * 100) / 100).toFixed(2),
                totalAmount: '-',
                totalInterest: '-',
                leftOver: (Math.round(leftOver * 100) / 100).toFixed(2),
                leftInterest: (Math.round(allInterest * 100) / 100).toFixed(2)
            }];


            // 每期利息
            let interest = 0;

            // 生成账单列表
            for (let leftTime = this.months; leftTime > 0; leftTime--) {

                interest = leftTime * deltaInterest;
                leftOver -= amount;
                leftInterest -= interest;

                this.billList.push({
                    name: `第${this.months - leftTime + 1}期`,
                    amount: (Math.round(amount * 100) / 100).toFixed(2),
                    interest: (Math.round(interest * 100) / 100).toFixed(2),
                    bill: (Math.round((amount + interest) * 100) / 100).toFixed(2),
                    totalAmount: (Math.round((this.money - leftOver) * 100) / 100).toFixed(2),
                    totalInterest: (Math.round((allInterest - leftInterest) * 100) / 100).toFixed(2),
                    leftOver: (Math.round(leftOver * 100) / 100).toFixed(2),
                    leftInterest: (Math.round(leftInterest * 100) / 100).toFixed(2)
                });
            }
        },

        /**
         * 计算模式切换
         */
        exchange: function () {
            this.calcMode = this.calcMode === 'rate' ? 'loan' : 'rate';
            this.$nextTick(() => {
                if (this.calcMode === 'rate') {
                    this.paybackConvert();
                } else {
                    this.revCalcYearRate();
                }
            });
        },

        /**
         * 通过给定的贷款本金、期限、总利息，进行真实年后利率反推
         */
        revCalcYearRate: function () {

            let retryArr = [];

            // 近似二分法定利率
            let getRate = (cur, curMore) => {
                // 找到上一次迭代时候的结果
                let rt = retryArr[retryArr.length - 2];

                if (curMore) {
                    if (rt[1]) { // 上次大，这次还大，直接找到最后一次「小」的值做二分，否则-2处理
                        for (let i = retryArr.length - 3; i >= 0; i--) {
                            if (!retryArr[i][1]) {
                                return (cur + retryArr[i][0]) / 2;
                            }
                        }
                        return cur - 2;
                    } else { // 上次小，这次大，直接两次结果做二分
                        return (cur + rt[0]) / 2;
                    }
                } else {
                    if (rt[1]) { // 上次小，这次还大，直接两次结果做二分
                        return (cur + rt[0]) / 2;
                    } else { // 上次小，这次还小，直接找到最后一次「大」的值做二分，否则+2处理
                        for (let i = retryArr.length - 3; i >= 0; i--) {
                            if (retryArr[i][1]) {
                                return (cur + retryArr[i][0]) / 2;
                            }
                        }
                        return cur + 2;
                    }
                }
            };

            // 利率近似值计算
            let calcTotal = (money, month, year, target, method) => {
                let rate = year / 12 / 100;

                let total = 0;
                if (method === 1) { // 等额本息
                    let mRate = Math.pow(rate + 1, month);
                    total = month * Math.round(money * rate * mRate / (mRate - 1) * 100) / 100;
                } else { // 等额本金
                    total = (money / month + money * rate + money / month * (1 + rate)) / 2 * month;
                }

                let delta = Math.abs(total - target);
                return delta >= 0 && delta <= ((target - money) / money * month / 12 / 0.1374) ? [year] : (total > target ? [year, 1] : [year, 0]);
            };


            // 迭代推演
            let guessRate = (money, month, total, method) => {
                retryArr = [[0, 0], [0, 0]];

                let cur = (total - money) / money / month * 12 * 100;
                let arr = calcTotal(money, month, cur, total, method);

                let rt, time = 0, result = 'unknown';
                while (time < 1000) {
                    time++;
                    if (arr.length === 1) {
                        result = Math.round(arr[0] * 10) / 10 + '％';
                        break;
                    }
                    else {
                        retryArr.push(arr);
                        cur = getRate(arr[0], arr[1]);
                        arr = calcTotal(money, month, cur, total, method);
                    }
                }

                return result;
            };

            this.money = this.revMoney;
            this.revAllInterest = Math.round((this.revAllAmount - this.money) * 100) / 100;
            this.revRate = guessRate(this.money, this.months, this.revAllAmount, parseInt(this.paybackMode));
        }
    }
});
