import React, { PureComponent } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { getMenuData } from '../common/menu';
import SiderMenu from '../components/SiderMenu';
import GlobalHeader from '../components/GlobalHeader';
import styles from './BasicLayout.less';


/**
 * 根据菜单取得重定向地址.
 */
const redirectData = [];
const getRedirect = (item) => {
  if (item && item.children) {
    if (item.children[0] && item.children[0].path) {
      redirectData.push({
        from: `${item.path}`,
        to: `${item.children[0].path}`,
      });
      item.children.forEach((children) => { getRedirect(children); });
    }
  }
};
getMenuData().forEach(getRedirect);

class BasicLayout extends PureComponent {
  logout() {
    this.props.logout();
  }
  render() {
    const { routerData, userData } = this.props;
    const RouteComponents = [];
    Object.keys(routerData).forEach((path, idx) => {
      if (path === '/') {
        RouteComponents.push(<Route exact key={idx + 1} path="/" render={() => <Redirect to="/home" />} />);
      } else {
        RouteComponents.push(
          <Route
            exact
            key={idx + 1}
            path={path}
            render={(props) => {
              const ChildComp = routerData[path].component;
              // 可以给子组件传一些参数如： isNavShow=true
              return (
                <ChildComp {...props} isNavShow />
              );
            } }
          />
        );
      }
    });
    return (
      <div className={styles.wapper}>
        <SiderMenu menuData={getMenuData()} />
        <div className={styles.container}>
          <GlobalHeader userData={userData} />
          <Switch>
            {RouteComponents}
            <Route render={() => <Redirect to="/home" />} />
          </Switch>
        </div>
      </div>
    );
  }
}

const mapState = ({ global, user }) => ({
  test: global.test,
  token: user.token,
  userData: user.userData,
});

export default connect(mapState)(BasicLayout);
