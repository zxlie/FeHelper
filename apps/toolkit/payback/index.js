/**
 * FeHelper 进制转换工具
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
        }
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

                if (parseInt(this.paybackMode) === 1) {
                    this.avgCapitalPlusInterest();
                } else {
                    this.avgCapitalOnly();
                }
            });
        },

        /**
         * 数据合法性校验
         */
        dataCheck: function () {
            if (!this.money || /\D/.test(this.money) || parseInt(this.money) <= 0) {
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
            if (!this.yearRate || !/\d|\./.test(this.yearRate) || parseFloat(this.yearRate) <= 0) {
                alert('请输入正确的贷款年化利率！');
                return false;
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
                totalAmount:'-',
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
                    totalAmount:(Math.round((this.money - leftOver) * 100) / 100).toFixed(2),
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
                totalAmount:'-',
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
                    totalAmount:(Math.round((this.money - leftOver) * 100) / 100).toFixed(2),
                    totalInterest: (Math.round((allInterest - leftInterest) * 100) / 100).toFixed(2),
                    leftOver: (Math.round(leftOver * 100) / 100).toFixed(2),
                    leftInterest: (Math.round(leftInterest * 100) / 100).toFixed(2)
                });
            }
        }
    }
});