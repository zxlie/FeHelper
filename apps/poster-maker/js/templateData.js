// 模板数据
export const templates = [
  {
    id: 'social-promo-1',
    name: '社交促销模板1',
    category: 'promotion',
    thumbnail: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '限时优惠' },
      { name: 'subtitle', type: 'text', label: '副标题', default: '全场商品5折起' },
      { name: 'date', type: 'text', label: '日期', default: '2023年12月1日-12月31日' },
      { name: 'mainImage', type: 'image', label: '主图', default: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ff5e62' },
      { name: 'textColor', type: 'color', label: '文字颜色', default: '#ffffff' },
      { name: 'footerText', type: 'text', label: '底部提示文字', default: '扫码或长按识别二维码' },
      { name: 'footerSubText', type: 'text', label: '底部副提示文字', default: '了解更多详情' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; color: ${data.textColor}; padding: 30px; font-family: Arial, sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 40%; overflow: hidden;">
          <img src="${data.mainImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="主图">
        </div>
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 65%; background: linear-gradient(to bottom, rgba(0,0,0,0), ${data.bgColor} 20%); padding: 30px; display: flex; flex-direction: column; justify-content: flex-end;">
          <h1 style="font-size: 36px; margin-bottom: 15px; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${data.title}</h1>
          <h2 style="font-size: 24px; margin-bottom: 20px; font-weight: 600;">${data.subtitle}</h2>
          <p style="font-size: 18px; margin-bottom: 30px;">${data.date}</p>
          <div style="width: 60px; height: 5px; background-color: ${data.textColor}; margin-bottom: 20px;"></div>
          <p style="font-size: 16px; font-style: italic;">${data.footerText}<br>${data.footerSubText}</p>
        </div>
      </div>
    `
  },
  {
    id: 'event-invitation-1',
    name: '活动邀请模板1',
    category: 'event',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'eventName', type: 'text', label: '活动名称', default: '新品发布会' },
      { name: 'eventDate', type: 'text', label: '活动日期', default: '2023年12月15日 14:00' },
      { name: 'eventLocation', type: 'text', label: '活动地点', default: '上海市浦东新区XX大厦' },
      { name: 'mainImage', type: 'image', label: '主图', default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#1a2a6c' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#fdbb2d' },
      { name: 'buttonText', type: 'text', label: '按钮文字', default: '诚挚邀请' },
      { name: 'footerText', type: 'text', label: '底部文字', default: '扫描二维码报名参加' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background: linear-gradient(to bottom, ${data.bgColor}, #000000); color: white; font-family: 'Helvetica', sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 50%; overflow: hidden;">
          <img src="${data.mainImage}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" alt="活动图片">
        </div>
        <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 50%; padding: 30px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 32px; margin-bottom: 20px; color: ${data.accentColor}; text-transform: uppercase; letter-spacing: 2px;">${data.eventName}</h1>
          <div style="width: 50px; height: 3px; background-color: ${data.accentColor}; margin-bottom: 20px;"></div>
          <p style="font-size: 18px; margin-bottom: 10px;"><i class="fas fa-calendar-alt" style="margin-right: 10px; color: ${data.accentColor};"></i> ${data.eventDate}</p>
          <p style="font-size: 18px; margin-bottom: 30px;"><i class="fas fa-map-marker-alt" style="margin-right: 10px; color: ${data.accentColor};"></i> ${data.eventLocation}</p>
          <div style="padding: 15px 30px; background-color: ${data.accentColor}; color: #000; font-size: 18px; font-weight: bold; border-radius: 30px;">${data.buttonText}</div>
        </div>
        <div style="position: absolute; bottom: 20px; width: 100%; text-align: center; font-size: 14px; opacity: 0.7;">
          <p>${data.footerText}</p>
        </div>
      </div>
    `
  },
  {
    id: 'product-launch-1',
    name: '产品发布模板1',
    category: 'product',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'productName', type: 'text', label: '产品名称', default: '智能手表 Pro' },
      { name: 'tagline', type: 'text', label: '产品标语', default: '科技引领未来' },
      { name: 'price', type: 'text', label: '产品价格', default: '¥1999' },
      { name: 'productImage', type: 'image', label: '产品图片', default: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#f6f6f6' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#ff6b6b' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'Arial', sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 40%; background-color: ${data.accentColor}; border-bottom-right-radius: 50%; border-bottom-left-radius: 50%;"></div>
        <div style="position: absolute; top: 50px; left: 0; width: 100%; text-align: center; color: white;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">${data.productName}</h1>
          <p style="font-size: 16px; font-style: italic;">${data.tagline}</p>
        </div>
        <div style="position: absolute; top: 180px; left: 50%; transform: translateX(-50%); width: 250px; height: 250px; border-radius: 50%; background-color: white; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <img src="${data.productImage}" style="max-width: 80%; max-height: 80%; object-fit: contain;" alt="产品图片">
        </div>
        <div style="position: absolute; bottom: 100px; left: 0; width: 100%; text-align: center;">
          <p style="font-size: 16px; color: #666; margin-bottom: 15px;">限时特惠价</p>
          <h2 style="font-size: 36px; color: ${data.accentColor}; font-weight: 700; margin-bottom: 20px;">${data.price}</h2>
          <div style="padding: 12px 30px; background-color: ${data.accentColor}; color: white; font-size: 18px; font-weight: bold; border-radius: 30px; display: inline-block;">立即购买</div>
        </div>
        <div style="position: absolute; bottom: 30px; width: 100%; text-align: center; font-size: 14px; color: #666;">
          <p>长按识别二维码了解更多</p>
        </div>
      </div>
    `
  },
  {
    id: 'quote-1',
    name: '名言分享模板1',
    category: 'social',
    thumbnail: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'quote', type: 'textarea', label: '名言内容', default: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。' },
      { name: 'author', type: 'text', label: '作者', default: '佚名' },
      { name: 'bgImage', type: 'image', label: '背景图片', default: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'overlayColor', type: 'color', label: '遮罩颜色', default: 'rgba(0, 0, 0, 0.4)' },
      { name: 'textColor', type: 'color', label: '文字颜色', default: '#ffffff' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; position: relative; font-family: 'Georgia', serif; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          <img src="${data.bgImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="背景图片">
        </div>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${data.overlayColor};"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; text-align: center; color: ${data.textColor};">
          <div style="font-size: 30px; margin-bottom: 20px;">"</div>
          <p style="font-size: 24px; line-height: 1.5; margin-bottom: 20px;">${data.quote}</p>
          <div style="font-size: 30px; margin-bottom: 20px;">"</div>
          <div style="width: 50px; height: 2px; background-color: ${data.textColor}; margin: 0 auto 20px;"></div>
          <p style="font-size: 18px; font-style: italic;">— ${data.author}</p>
        </div>
        <div style="position: absolute; bottom: 30px; width: 100%; text-align: center; color: ${data.textColor}; font-size: 14px;">
          <p>分享你的感悟</p>
        </div>
      </div>
    `
  },
  {
    id: 'food-recipe-1',
    name: '美食菜谱模板1',
    category: 'food',
    thumbnail: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'dishName', type: 'text', label: '菜品名称', default: '香煎三文鱼' },
      { name: 'description', type: 'textarea', label: '简短描述', default: '鲜嫩多汁，营养丰富的美味佳肴' },
      { name: 'cookTime', type: 'text', label: '烹饪时间', default: '25分钟' },
      { name: 'foodImage', type: 'image', label: '菜品图片', default: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ffffff' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#ff9a3c' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'Montserrat', sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 60%; overflow: hidden;">
          <img src="${data.foodImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="菜品图片">
        </div>
        <div style="position: absolute; top: 60%; left: 0; width: 100%; height: 40%; padding: 30px;">
          <div style="width: 60px; height: 5px; background-color: ${data.accentColor}; margin-bottom: 15px;"></div>
          <h1 style="font-size: 28px; color: #333; margin-bottom: 10px; font-weight: 700;">${data.dishName}</h1>
          <p style="font-size: 16px; color: #666; margin-bottom: 20px; line-height: 1.5;">${data.description}</p>
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-right: 20px;">
              <i class="fas fa-clock" style="color: ${data.accentColor}; margin-right: 8px;"></i>
              <span style="color: #666;">${data.cookTime}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <i class="fas fa-utensils" style="color: ${data.accentColor}; margin-right: 8px;"></i>
              <span style="color: #666;">2人份</span>
            </div>
          </div>
          <div style="padding: 10px 20px; background-color: ${data.accentColor}; color: white; font-size: 16px; font-weight: 600; border-radius: 30px; display: inline-block;">查看完整食谱</div>
        </div>
        <div style="position: absolute; bottom: 20px; right: 20px; background-color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <i class="fas fa-qrcode" style="font-size: 30px; color: ${data.accentColor};"></i>
        </div>
      </div>
    `
  },
  {
    id: 'travel-1',
    name: '旅行分享模板1',
    category: 'travel',
    thumbnail: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'location', type: 'text', label: '地点名称', default: '巴厘岛' },
      { name: 'tagline', type: 'text', label: '标语', default: '遇见天堂般的美景' },
      { name: 'date', type: 'text', label: '日期', default: '2023年夏' },
      { name: 'travelImage', type: 'image', label: '旅行图片', default: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'overlayColor', type: 'color', label: '遮罩颜色', default: 'rgba(0, 0, 0, 0.3)' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#4ecdc4' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; position: relative; font-family: 'Roboto', sans-serif; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          <img src="${data.travelImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="旅行图片">
        </div>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, ${data.overlayColor}, rgba(0,0,0,0.7));"></div>
        <div style="position: absolute; bottom: 80px; left: 30px; color: white;">
          <p style="font-size: 18px; margin-bottom: 10px; letter-spacing: 2px;">${data.date}</p>
          <h1 style="font-size: 42px; font-weight: 700; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${data.location}</h1>
          <div style="width: 60px; height: 4px; background-color: ${data.accentColor}; margin-bottom: 15px;"></div>
          <p style="font-size: 20px; font-style: italic; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">${data.tagline}</p>
        </div>
        <div style="position: absolute; bottom: 30px; left: 30px; display: flex; align-items: center;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${data.accentColor}; display: flex; justify-content: center; align-items: center; margin-right: 15px;">
            <i class="fas fa-map-marker-alt" style="color: white; font-size: 20px;"></i>
          </div>
          <p style="color: white; font-size: 16px;">查看我的旅行攻略</p>
        </div>
      </div>
    `
  }
];

// 添加更多模板...

// 小红书风格模板
export const xiaohongshuTemplates = [
  {
    id: 'xiaohongshu-1',
    name: '小红书风格1',
    category: 'xiaohongshu',
    thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '这家店也太好吃了吧！绝对五星推荐！' },
      { name: 'content', type: 'textarea', label: '内容', default: '无意中发现的宝藏小店，环境超级好，菜品颜值和口味都很赞，价格也很实惠，强烈推荐大家来打卡！' },
      { name: 'tags', type: 'text', label: '标签', default: '#美食探店 #宝藏餐厅 #推荐' },
      { name: 'mainImage', type: 'image', label: '主图', default: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ffffff' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#ff4757' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 60%; overflow: hidden;">
          <img src="${data.mainImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="主图">
        </div>
        <div style="position: absolute; top: 60%; left: 0; width: 100%; height: 40%; padding: 20px; background-color: white; border-top-left-radius: 20px; border-top-right-radius: 20px; box-shadow: 0 -5px 15px rgba(0,0,0,0.05);">
          <h1 style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 15px; line-height: 1.4;">${data.title}</h1>
          <p style="font-size: 15px; color: #666; margin-bottom: 15px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${data.content}</p>
          <p style="font-size: 14px; color: ${data.accentColor}; margin-bottom: 15px;">${data.tags}</p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
              <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #f5f5f5; margin-right: 10px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
              </div>
              <span style="font-size: 14px; color: #333;">小红薯123</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="display: flex; align-items: center; margin-right: 15px;">
                <i class="fas fa-heart" style="color: ${data.accentColor}; margin-right: 5px; font-size: 14px;"></i>
                <span style="font-size: 12px; color: #999;">258</span>
              </div>
              <div style="display: flex; align-items: center;">
                <i class="fas fa-comment" style="color: #999; margin-right: 5px; font-size: 14px;"></i>
                <span style="font-size: 12px; color: #999;">36</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'xiaohongshu-2',
    name: '小红书风格2',
    category: 'xiaohongshu',
    thumbnail: 'https://images.unsplash.com/photo-1469594292607-7bd90f8d3ba4?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '超治愈的周末旅行，放空自己的绝佳去处' },
      { name: 'content', type: 'textarea', label: '内容', default: '周末和闺蜜一起去了这个小众景点，环境超级好，人也不多，拍照很出片，完全治愈了工作的疲惫~' },
      { name: 'tags', type: 'text', label: '标签', default: '#周末出行 #小众景点 #旅行 #治愈系' },
      { name: 'mainImage', type: 'image', label: '主图', default: 'https://images.unsplash.com/photo-1469594292607-7bd90f8d3ba4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#f9f9f9' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#ff4757' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 15px;">
        <div style="background-color: white; border-radius: 15px; overflow: hidden; height: 100%; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
          <div style="height: 55%; overflow: hidden;">
            <img src="${data.mainImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="主图">
          </div>
          <div style="padding: 20px; height: 45%; overflow: hidden;">
            <h1 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${data.title}</h1>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${data.content}</p>
            <p style="font-size: 13px; color: ${data.accentColor}; margin-bottom: 15px;">${data.tags}</p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #f5f5f5; margin-right: 8px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
                </div>
                <span style="font-size: 13px; color: #333;">旅行达人</span>
              </div>
              <div style="display: flex; align-items: center;">
                <i class="fas fa-heart" style="color: ${data.accentColor}; margin-right: 3px; font-size: 13px;"></i>
                <span style="font-size: 12px; color: #999; margin-right: 10px;">462</span>
                <i class="fas fa-bookmark" style="color: #999; margin-right: 3px; font-size: 13px;"></i>
                <span style="font-size: 12px; color: #999;">89</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

// 朋友圈风格模板
export const wechatMomentsTemplates = [
  {
    id: 'wechat-moments-1',
    name: '朋友圈风格1',
    category: 'wechat',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'content', type: 'textarea', label: '内容', default: '今天的晚餐，色香味俱全，自己做的就是香！#美食 #晚餐' },
      { name: 'mainImage', type: 'image', label: '主图', default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'location', type: 'text', label: '位置', default: '家里的小厨房' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#f7f7f7' },
      { name: 'textColor', type: 'color', label: '文字颜色', default: '#333333' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); padding: 15px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f5f5f5; margin-right: 10px; overflow: hidden;">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
            </div>
            <div>
              <p style="font-size: 15px; font-weight: 600; color: ${data.textColor}; margin-bottom: 3px;">美食达人</p>
              <p style="font-size: 12px; color: #999;">2小时前</p>
            </div>
          </div>
          <p style="font-size: 15px; color: ${data.textColor}; margin-bottom: 15px; line-height: 1.5;">${data.content}</p>
          <div style="border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
            <img src="${data.mainImage}" style="width: 100%; object-fit: cover;" alt="分享图片">
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <i class="fas fa-map-marker-alt" style="color: #999; margin-right: 5px; font-size: 12px;"></i>
            <span style="font-size: 12px; color: #576b95;">${data.location}</span>
          </div>
          <div style="display: flex; justify-content: flex-end; border-top: 1px solid #f0f0f0; padding-top: 12px;">
            <div style="display: flex; align-items: center; margin-right: 20px;">
              <i class="far fa-thumbs-up" style="color: #576b95; margin-right: 5px; font-size: 16px;"></i>
              <span style="font-size: 14px; color: #576b95;">赞</span>
            </div>
            <div style="display: flex; align-items: center;">
              <i class="far fa-comment" style="color: #576b95; margin-right: 5px; font-size: 16px;"></i>
              <span style="font-size: 14px; color: #576b95;">评论</span>
            </div>
          </div>
        </div>
        <div style="position: absolute; bottom: 20px; width: 100%; text-align: center; left: 0; font-size: 12px; color: #999;">
          <p>长按图片保存，发朋友圈</p>
        </div>
      </div>
    `
  },
  {
    id: 'wechat-moments-2',
    name: '朋友圈风格2',
    category: 'wechat',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'content', type: 'textarea', label: '内容', default: '和好友共度美好时光，感恩遇见 🙏' },
      { name: 'mainImage', type: 'image', label: '主图', default: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'time', type: 'text', label: '时间', default: '昨天 20:30' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#f7f7f7' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#576b95' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 20px;">
        <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f5f5; margin-right: 10px; overflow: hidden;">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
            </div>
            <p style="font-size: 15px; font-weight: 600; color: #333;">生活记录者</p>
          </div>
          <p style="font-size: 12px; color: #999;">${data.time}</p>
        </div>
        <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); padding: 15px;">
          <p style="font-size: 15px; color: #333; margin-bottom: 15px; line-height: 1.5;">${data.content}</p>
          <div style="border-radius: 8px; overflow: hidden; margin-bottom: 15px;">
            <img src="${data.mainImage}" style="width: 100%; object-fit: cover;" alt="分享图片">
          </div>
          <div style="display: flex; align-items: center; margin-top: 10px;">
            <div style="display: flex; align-items: center; margin-right: 15px;">
              <i class="fas fa-heart" style="color: ${data.accentColor}; margin-right: 5px; font-size: 14px;"></i>
              <span style="font-size: 14px; color: ${data.accentColor};">25</span>
            </div>
            <div style="height: 14px; width: 1px; background-color: #e0e0e0; margin-right: 15px;"></div>
            <div style="display: flex; align-items: center;">
              <i class="fas fa-comment" style="color: ${data.accentColor}; margin-right: 5px; font-size: 14px;"></i>
              <span style="font-size: 14px; color: ${data.accentColor};">8</span>
            </div>
          </div>
        </div>
        <div style="margin-top: 15px; background-color: white; border-radius: 8px; padding: 12px 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div style="display: flex; margin-bottom: 8px;">
            <span style="font-size: 14px; color: ${data.accentColor}; font-weight: 500; margin-right: 5px;">张三：</span>
            <span style="font-size: 14px; color: #333;">真羡慕你们！下次带上我～</span>
          </div>
          <div style="display: flex;">
            <span style="font-size: 14px; color: ${data.accentColor}; font-weight: 500; margin-right: 5px;">李四：</span>
            <span style="font-size: 14px; color: #333;">看起来很开心，地点在哪里？</span>
          </div>
        </div>
        <div style="position: absolute; bottom: 20px; width: 100%; text-align: center; left: 0; font-size: 12px; color: #999;">
          <p>长按图片保存，发朋友圈</p>
        </div>
      </div>
    `
  }
];

// 工作群分享模板
export const workGroupTemplates = [
  {
    id: 'work-group-1',
    name: '工作群分享1',
    category: 'work',
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '本周业绩回顾与下周计划' },
      { name: 'content', type: 'textarea', label: '内容', default: '团队本周超额完成销售目标，达成率120%。下周将重点关注新产品推广和客户回访工作。' },
      { name: 'date', type: 'text', label: '日期', default: '2023年12月15日' },
      { name: 'chartImage', type: 'image', label: '图表图片', default: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ffffff' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#2c3e50' },
      { name: 'targetValue', type: 'text', label: '目标达成率', default: '120%' },
      { name: 'growthValue', type: 'text', label: '同比增长率', default: '+15%' },
      { name: 'satisfactionValue', type: 'text', label: '客户满意度', default: '89%' },
      { name: 'authorTitle', type: 'text', label: '作者职位', default: '销售总监' },
      { name: 'authorRole', type: 'text', label: '作者角色', default: '团队负责人' },
      { name: 'buttonText', type: 'text', label: '按钮文字', default: '查看详情' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.08); height: calc(100% - 40px);">
          <div style="background-color: ${data.accentColor}; color: white; padding: 20px; position: relative;">
            <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 10px;">${data.title}</h1>
            <p style="font-size: 14px;">${data.date}</p>
            <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center;">
              <i class="fas fa-chart-line" style="color: white; font-size: 20px;"></i>
            </div>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.6;">${data.content}</p>
            <div style="border-radius: 8px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <img src="${data.chartImage}" style="width: 100%; object-fit: cover;" alt="图表">
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 30px;">
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 24px; font-weight: 600; color: ${data.accentColor}; margin-bottom: 5px;">${data.targetValue}</div>
                <p style="font-size: 14px; color: #666;">目标达成</p>
              </div>
              <div style="width: 1px; background-color: #e0e0e0;"></div>
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 24px; font-weight: 600; color: ${data.accentColor}; margin-bottom: 5px;">${data.growthValue}</div>
                <p style="font-size: 14px; color: #666;">同比增长</p>
              </div>
              <div style="width: 1px; background-color: #e0e0e0;"></div>
              <div style="text-align: center; flex: 1;">
                <div style="font-size: 24px; font-weight: 600; color: ${data.accentColor}; margin-bottom: 5px;">${data.satisfactionValue}</div>
                <p style="font-size: 14px; color: #666;">客户满意度</p>
              </div>
            </div>
          </div>
          <div style="padding: 15px 20px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #f5f5f5; margin-right: 10px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
              </div>
              <div>
                <p style="font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px;">${data.authorTitle}</p>
                <p style="font-size: 12px; color: #999;">${data.authorRole}</p>
              </div>
            </div>
            <div style="padding: 8px 15px; background-color: ${data.accentColor}; color: white; font-size: 14px; border-radius: 20px;">
              ${data.buttonText}
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'work-group-2',
    name: '工作群分享2',
    category: 'work',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '项目进度报告' },
      { name: 'projectName', type: 'text', label: '项目名称', default: '新零售系统升级' },
      { name: 'progress', type: 'text', label: '进度百分比', default: '75' },
      { name: 'startDate', type: 'text', label: '开始日期', default: '2023年10月15日' },
      { name: 'deadline', type: 'text', label: '截止日期', default: '2023年12月31日' },
      { name: 'projectImage', type: 'image', label: '项目图片', default: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#f8f9fa' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#3498db' },
      { name: 'teamMemberCount', type: 'text', label: '额外团队成员数', default: '+3' },
      { name: 'reportLinkText', type: 'text', label: '报告链接文字', default: '查看详细报告' },
      { name: 'shareLinkText', type: 'text', label: '分享链接文字', default: '分享' },
      { name: 'teamMembersLabel', type: 'text', label: '团队成员标签', default: '团队成员' },
      { name: 'progressLabel', type: 'text', label: '进度标签', default: '项目进度' },
      { name: 'startDateLabel', type: 'text', label: '开始日期标签', default: '开始日期' },
      { name: 'deadlineLabel', type: 'text', label: '截止日期标签', default: '截止日期' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.08); height: calc(100% - 40px);">
          <div style="height: 40%; overflow: hidden; position: relative;">
            <img src="${data.projectImage}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.85);" alt="项目图片">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px;">
              <h1 style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 10px;">${data.title}</h1>
              <div style="display: flex; align-items: center;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #2ecc71; margin-right: 8px;"></div>
                <p style="font-size: 14px; color: white;">${data.projectName}</p>
              </div>
            </div>
          </div>
          <div style="padding: 25px;">
            <div style="margin-bottom: 25px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <p style="font-size: 16px; color: #333; font-weight: 500;">${data.progressLabel}</p>
                <p style="font-size: 16px; font-weight: 600; color: ${data.accentColor};">${data.progress}%</p>
              </div>
              <div style="width: 100%; height: 8px; background-color: #e0e0e0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${data.progress}%; height: 100%; background-color: ${data.accentColor};"></div>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 25px;">
              <div style="flex: 1; border-right: 1px solid #e0e0e0; padding-right: 15px;">
                <p style="font-size: 13px; color: #666; margin-bottom: 5px;">${data.startDateLabel}</p>
                <p style="font-size: 15px; color: #333; font-weight: 500;">${data.startDate}</p>
              </div>
              <div style="flex: 1; padding-left: 15px;">
                <p style="font-size: 13px; color: #666; margin-bottom: 5px;">${data.deadlineLabel}</p>
                <p style="font-size: 15px; color: #333; font-weight: 500;">${data.deadline}</p>
              </div>
            </div>
            <div style="margin-bottom: 25px;">
              <p style="font-size: 16px; color: #333; font-weight: 500; margin-bottom: 10px;">${data.teamMembersLabel}</p>
              <div style="display: flex;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f5f5; border: 2px solid white; overflow: hidden; margin-right: -10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="成员1">
                </div>
                <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f5f5; border: 2px solid white; overflow: hidden; margin-right: -10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="成员2">
                </div>
                <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f5f5; border: 2px solid white; overflow: hidden; margin-right: -10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="成员3">
                </div>
                <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${data.accentColor}; border: 2px solid white; overflow: hidden; display: flex; justify-content: center; align-items: center; color: white; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  ${data.teamMemberCount}
                </div>
              </div>
            </div>
          </div>
          <div style="padding: 15px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between;">
            <div style="display: flex; align-items: center; color: ${data.accentColor}; font-size: 14px;">
              <i class="fas fa-file-alt" style="margin-right: 8px;"></i>
              <span>${data.reportLinkText}</span>
            </div>
            <div style="display: flex; align-items: center; color: ${data.accentColor}; font-size: 14px;">
              <i class="fas fa-share-alt" style="margin-right: 8px;"></i>
              <span>${data.shareLinkText}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

// 技术团队模板
export const techTemplates = [
  {
    id: 'tech-report-1',
    name: '技术周报模板',
    category: 'tech',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '技术团队周报' },
      { name: 'week', type: 'text', label: '周期', default: '2023年第48周' },
      { name: 'achievements', type: 'textarea', label: '主要成果', default: '1. 完成用户中心重构\n2. 修复了5个关键性Bug\n3. 性能优化提升30%' },
      { name: 'nextWeek', type: 'textarea', label: '下周计划', default: '1. 开始新功能开发\n2. 进行代码审查\n3. 优化CI/CD流程' },
      { name: 'bgImage', type: 'image', label: '背景图片', default: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#1e272e' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#0984e3' },
      { name: 'bugFixCount', type: 'text', label: 'Bug修复数量', default: '5' },
      { name: 'newFeatureCount', type: 'text', label: '新功能数量', default: '2' },
      { name: 'performanceImprovement', type: 'text', label: '性能提升', default: '30%' },
      { name: 'bugFixLabel', type: 'text', label: 'Bug修复标签', default: 'Bug修复' },
      { name: 'newFeatureLabel', type: 'text', label: '新功能标签', default: '新功能' },
      { name: 'performanceLabel', type: 'text', label: '性能标签', default: '性能提升' },
      { name: 'achievementsTitle', type: 'text', label: '成果标题', default: '本周成果' },
      { name: 'nextWeekTitle', type: 'text', label: '计划标题', default: '下周计划' },
      { name: 'footerText', type: 'text', label: '页脚文本', default: '技术团队 © 2023' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'Roboto', 'PingFang SC', sans-serif; position: relative; overflow: hidden; padding: 20px; color: white;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 30%; opacity: 0.2;">
          <img src="${data.bgImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="背景图片">
        </div>
        <div style="position: relative; z-index: 2; padding: 15px;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: white;">${data.title}</h1>
          <div style="width: 50px; height: 4px; background-color: ${data.accentColor}; margin-bottom: 15px;"></div>
          <p style="font-size: 16px; margin-bottom: 25px; color: #dfe6e9;">${data.week}</p>
          
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: ${data.accentColor};">${data.achievementsTitle}</h2>
            <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 15px;">
              <p style="font-size: 15px; line-height: 1.6; white-space: pre-line;">${data.achievements}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: ${data.accentColor};">${data.nextWeekTitle}</h2>
            <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 15px;">
              <p style="font-size: 15px; line-height: 1.6; white-space: pre-line;">${data.nextWeek}</p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="text-align: center; background-color: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; flex: 1; margin-right: 10px;">
              <p style="font-size: 24px; font-weight: 700; color: ${data.accentColor};">${data.bugFixCount}</p>
              <p style="font-size: 14px; color: #dfe6e9;">${data.bugFixLabel}</p>
            </div>
            <div style="text-align: center; background-color: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; flex: 1; margin-right: 10px;">
              <p style="font-size: 24px; font-weight: 700; color: ${data.accentColor};">${data.newFeatureCount}</p>
              <p style="font-size: 14px; color: #dfe6e9;">${data.newFeatureLabel}</p>
            </div>
            <div style="text-align: center; background-color: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; flex: 1;">
              <p style="font-size: 24px; font-weight: 700; color: ${data.accentColor};">${data.performanceImprovement}</p>
              <p style="font-size: 14px; color: #dfe6e9;">${data.performanceLabel}</p>
            </div>
          </div>
        </div>
        <div style="position: absolute; bottom: 20px; right: 20px; font-size: 14px; color: #dfe6e9;">
          <p>${data.footerText}</p>
        </div>
      </div>
    `
  },
  {
    id: 'code-share-1',
    name: '代码分享模板',
    category: 'tech',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '优雅的代码解决方案' },
      { name: 'language', type: 'text', label: '编程语言', default: 'JavaScript' },
      { name: 'description', type: 'textarea', label: '描述', default: '这个优化方案将原本O(n²)的算法复杂度降低到了O(n)，大幅提升了性能。' },
      { name: 'codeImage', type: 'image', label: '代码截图', default: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#282c34' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#61dafb' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'Fira Code', 'Source Code Pro', monospace; position: relative; overflow: hidden; padding: 20px; color: #abb2bf;">
        <div style="position: relative; z-index: 2;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ff5f56; margin-right: 8px;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ffbd2e; margin-right: 8px;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #27c93f; margin-right: 15px;"></div>
            <p style="font-size: 14px; color: #dfe6e9;">${data.language} - Code Snippet</p>
          </div>
          
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 15px; color: ${data.accentColor};">${data.title}</h1>
          
          <div style="background-color: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px; max-height: 300px; overflow: hidden;">
            <img src="${data.codeImage}" style="width: 100%; object-fit: contain;" alt="代码截图">
          </div>
          
          <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="font-size: 15px; line-height: 1.6;">${data.description}</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="display: flex; align-items: center;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #2d3436; margin-right: 10px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
              </div>
              <div>
                <p style="font-size: 14px; color: white; margin-bottom: 2px;">高级开发工程师</p>
                <p style="font-size: 12px; color: #dfe6e9;">技术架构组</p>
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="padding: 8px 15px; background-color: ${data.accentColor}; color: ${data.bgColor}; font-size: 14px; border-radius: 4px; font-weight: 600;">
                查看完整代码
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

// 产品团队模板
export const productTemplates = [
  {
    id: 'product-roadmap-1',
    name: '产品路线图',
    category: 'product',
    thumbnail: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '2024年产品路线图' },
      { name: 'q1Goals', type: 'textarea', label: 'Q1目标', default: '用户体验优化\n核心功能重构\n新用户引导流程' },
      { name: 'q2Goals', type: 'textarea', label: 'Q2目标', default: '数据分析平台\n企业版功能\nAPI升级' },
      { name: 'productImage', type: 'image', label: '产品图片', default: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ffffff' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#6c5ce7' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 40%; overflow: hidden;">
          <img src="${data.productImage}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9);" alt="产品图片">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0), ${data.bgColor});"></div>
        </div>
        
        <div style="position: absolute; top: 30px; left: 30px; right: 30px;">
          <h1 style="font-size: 28px; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${data.title}</h1>
        </div>
        
        <div style="position: absolute; top: 35%; left: 0; width: 100%; padding: 30px;">
          <div style="display: flex; margin-bottom: 30px;">
            <div style="flex: 1; margin-right: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${data.accentColor}; color: white; display: flex; justify-content: center; align-items: center; margin-right: 10px; font-weight: 600;">Q1</div>
                <h2 style="font-size: 18px; font-weight: 600; color: #333;">1-3月</h2>
              </div>
              <div style="background-color: #f5f7fa; border-radius: 8px; padding: 15px; border-left: 4px solid ${data.accentColor};">
                <p style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-line;">${data.q1Goals}</p>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${data.accentColor}; color: white; display: flex; justify-content: center; align-items: center; margin-right: 10px; font-weight: 600;">Q2</div>
                <h2 style="font-size: 18px; font-weight: 600; color: #333;">4-6月</h2>
              </div>
              <div style="background-color: #f5f7fa; border-radius: 8px; padding: 15px; border-left: 4px solid ${data.accentColor};">
                <p style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-line;">${data.q2Goals}</p>
              </div>
            </div>
          </div>
          
          <div style="background-color: ${data.accentColor}; border-radius: 8px; padding: 20px; color: white;">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">关键指标</h3>
            <div style="display: flex; justify-content: space-between;">
              <div style="text-align: center; flex: 1;">
                <p style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">+30%</p>
                <p style="font-size: 14px;">用户增长</p>
              </div>
              <div style="text-align: center; flex: 1;">
                <p style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">-25%</p>
                <p style="font-size: 14px;">流失率</p>
              </div>
              <div style="text-align: center; flex: 1;">
                <p style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">+45%</p>
                <p style="font-size: 14px;">转化率</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 20px; right: 30px; display: flex; align-items: center;">
          <p style="font-size: 14px; color: #666; margin-right: 10px;">由产品团队制作</p>
          <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${data.accentColor}; display: flex; justify-content: center; align-items: center;">
            <i class="fas fa-rocket" style="color: white; font-size: 14px;"></i>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'user-research-1',
    name: '用户研究报告',
    category: 'product',
    thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '用户研究报告' },
      { name: 'subtitle', type: 'text', label: '副标题', default: '核心用户行为分析' },
      { name: 'findings', type: 'textarea', label: '主要发现', default: '1. 80%的用户在首次使用时遇到了导航困难\n2. 核心功能的使用频率低于预期\n3. 用户对新功能的接受度高' },
      { name: 'recommendations', type: 'textarea', label: '改进建议', default: '1. 优化首页导航结构\n2. 增强核心功能的引导\n3. 加快新功能的迭代速度' },
      { name: 'researchImage', type: 'image', label: '研究图片', default: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#f5f7fa' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#00b894' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 25px;">
        <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.05); height: calc(100% - 50px);">
          <div style="padding: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <div>
                <h1 style="font-size: 24px; font-weight: 700; color: #333; margin-bottom: 8px;">${data.title}</h1>
                <p style="font-size: 16px; color: #666;">${data.subtitle}</p>
              </div>
              <div style="width: 50px; height: 50px; border-radius: 50%; background-color: ${data.accentColor}; display: flex; justify-content: center; align-items: center;">
                <i class="fas fa-user-check" style="color: white; font-size: 20px;"></i>
              </div>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 25px;">
              <div style="flex: 1;">
                <img src="${data.researchImage}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;" alt="研究图片">
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="background-color: ${data.accentColor}; border-radius: 8px; padding: 15px; color: white; margin-bottom: 10px;">
                  <p style="font-size: 14px; margin-bottom: 5px;">参与用户</p>
                  <p style="font-size: 28px; font-weight: 700;">120</p>
                </div>
                <div style="display: flex; gap: 10px;">
                  <div style="flex: 1; background-color: #f5f7fa; border-radius: 8px; padding: 15px;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 5px;">满意度</p>
                    <p style="font-size: 22px; font-weight: 600; color: #333;">78%</p>
                  </div>
                  <div style="flex: 1; background-color: #f5f7fa; border-radius: 8px; padding: 15px;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 5px;">完成率</p>
                    <p style="font-size: 22px; font-weight: 600; color: #333;">65%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center;">
                <i class="fas fa-lightbulb" style="color: ${data.accentColor}; margin-right: 8px;"></i>
                主要发现
              </h2>
              <div style="background-color: #f5f7fa; border-radius: 8px; padding: 15px;">
                <p style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-line;">${data.findings}</p>
              </div>
            </div>
            
            <div>
              <h2 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center;">
                <i class="fas fa-clipboard-check" style="color: ${data.accentColor}; margin-right: 8px;"></i>
                改进建议
              </h2>
              <div style="background-color: #f5f7fa; border-radius: 8px; padding: 15px;">
                <p style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-line;">${data.recommendations}</p>
              </div>
            </div>
          </div>
          
          <div style="padding: 15px 25px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f7fa; margin-right: 10px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
              </div>
              <div>
                <p style="font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px;">用户体验设计师</p>
                <p style="font-size: 12px; color: #999;">产品团队</p>
              </div>
            </div>
            <p style="font-size: 14px; color: #999;">2023年12月</p>
          </div>
        </div>
      </div>
    `
  }
];

// 运营团队模板
export const operationTemplates = [
  {
    id: 'data-report-1',
    name: '数据分析报告',
    category: 'operation',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '标题', default: '11月营销活动分析报告' },
      { name: 'highlights', type: 'textarea', label: '亮点', default: '1. 新用户增长率达到35%，超过目标25%\n2. 活动转化率提升40%\n3. 社交媒体互动量增长60%' },
      { name: 'nextSteps', type: 'textarea', label: '下一步计划', default: '1. 扩大社交媒体投放\n2. 优化转化漏斗\n3. 增加会员专属活动' },
      { name: 'chartImage', type: 'image', label: '图表图片', default: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ffffff' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#fd79a8' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${data.accentColor}, #a29bfe); border-radius: 15px 15px 0 0; padding: 25px; color: white;">
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 10px;">${data.title}</h1>
          <p style="font-size: 14px; opacity: 0.9;">运营数据分析 · 2023年11月</p>
        </div>
        
        <div style="background-color: white; border-radius: 0 0 15px 15px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 25px;">
            <img src="${data.chartImage}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" alt="数据图表">
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
            <div style="text-align: center; flex: 1; padding: 15px; border-radius: 8px; background-color: #f8f9fa;">
              <p style="font-size: 28px; font-weight: 700; color: ${data.accentColor}; margin-bottom: 5px;">35%</p>
              <p style="font-size: 14px; color: #666;">新用户增长</p>
            </div>
            <div style="text-align: center; flex: 1; padding: 15px; border-radius: 8px; background-color: #f8f9fa; margin: 0 15px;">
              <p style="font-size: 28px; font-weight: 700; color: ${data.accentColor}; margin-bottom: 5px;">40%</p>
              <p style="font-size: 14px; color: #666;">转化率提升</p>
            </div>
            <div style="text-align: center; flex: 1; padding: 15px; border-radius: 8px; background-color: #f8f9fa;">
              <p style="font-size: 28px; font-weight: 700; color: ${data.accentColor}; margin-bottom: 5px;">60%</p>
              <p style="font-size: 14px; color: #666;">互动量增长</p>
            </div>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center;">
              <i class="fas fa-chart-line" style="color: ${data.accentColor}; margin-right: 8px;"></i>
              活动亮点
            </h2>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
              <p style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-line;">${data.highlights}</p>
            </div>
          </div>
          
          <div>
            <h2 style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center;">
              <i class="fas fa-tasks" style="color: ${data.accentColor}; margin-right: 8px;"></i>
              下一步计划
            </h2>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
              <p style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-line;">${data.nextSteps}</p>
            </div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 30px; right: 30px; display: flex; align-items: center;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f7fa; margin-right: 10px; overflow: hidden;">
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="用户头像">
          </div>
          <div>
            <p style="font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px;">增长运营专家</p>
            <p style="font-size: 12px; color: #999;">运营团队</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'campaign-1',
    name: '营销活动海报',
    category: 'operation',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=240&q=80',
    fields: [
      { name: 'title', type: 'text', label: '活动标题', default: '年末狂欢购物节' },
      { name: 'subtitle', type: 'text', label: '副标题', default: '全场低至5折，多重好礼等你拿' },
      { name: 'period', type: 'text', label: '活动时间', default: '12月18日-12月31日' },
      { name: 'highlights', type: 'textarea', label: '活动亮点', default: '1. 爆品限时秒杀\n2. 满300减100\n3. 新用户专享券\n4. 会员额外95折' },
      { name: 'campaignImage', type: 'image', label: '活动图片', default: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'bgColor', type: 'color', label: '背景颜色', default: '#ffeaa7' },
      { name: 'accentColor', type: 'color', label: '强调色', default: '#d63031' }
    ],
    template: (data) => `
      <div style="width: 100%; height: 100%; background-color: ${data.bgColor}; font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 50%; overflow: hidden;">
          <img src="${data.campaignImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="活动图片">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4));"></div>
        </div>
        
        <div style="position: absolute; top: 30px; right: 30px; background-color: ${data.accentColor}; color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; transform: rotate(5deg); box-shadow: 0 3px 10px rgba(0,0,0,0.2);">
          限时活动
        </div>
        
        <div style="position: absolute; top: 50%; left: 0; width: 100%; transform: translateY(-50%); padding: 0 30px; text-align: center;">
          <h1 style="font-size: 36px; font-weight: 800; color: white; margin-bottom: 10px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">${data.title}</h1>
          <p style="font-size: 18px; color: white; margin-bottom: 5px; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${data.subtitle}</p>
        </div>
        
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background-color: white; border-top-left-radius: 30px; border-top-right-radius: 30px; padding: 30px; box-shadow: 0 -5px 20px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #333;">活动详情</h2>
            <div style="padding: 5px 12px; background-color: #f8f9fa; border-radius: 15px; font-size: 14px; color: #666;">${data.period}</div>
          </div>
          
          <div style="margin-bottom: 25px;">
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 15px;">
              <p style="font-size: 15px; line-height: 1.8; color: #333; white-space: pre-line;">${data.highlights}</p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <div style="padding: 12px 30px; background-color: ${data.accentColor}; color: white; font-size: 16px; font-weight: 600; border-radius: 25px; box-shadow: 0 4px 10px rgba(214, 48, 49, 0.3);">
              立即参与
            </div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 20px; left: 30px; display: flex; align-items: center;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${data.accentColor}; display: flex; justify-content: center; align-items: center; margin-right: 10px;">
            <i class="fas fa-qrcode" style="color: white; font-size: 14px;"></i>
          </div>
          <p style="font-size: 14px; color: #666;">扫码了解更多</p>
        </div>
      </div>
    `
  }
];

// 合并所有模板
templates.push(...xiaohongshuTemplates, ...wechatMomentsTemplates, ...workGroupTemplates, ...techTemplates, ...productTemplates, ...operationTemplates);
