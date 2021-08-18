import React, {useEffect, useState} from 'react';
import {connect} from "react-redux";
import withReducer from 'app/store/withReducer';
import reducer from './store/reducers';
import {Icon, IconButton, Link, Tab, Tabs} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ErrorIcon from '@material-ui/icons/Error';
import {FuseAnimate, FusePageCarded} from '@fuse';
import {makeStyles} from '@material-ui/styles';
import MUIDataTable from "mui-datatables";
import RefreshToolbar from "./RefreshToolbar";
import Button from "@material-ui/core/Button";
import clsx from 'clsx';
import _ from '@lodash';
import Loader from "../Loader/Loader";
import {MoreVertRounded} from "@material-ui/icons";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Box from "@material-ui/core/Box";
import * as moment from "moment";

const useStyles = makeStyles(theme => ({
    layoutHeader: {
        height: 122,
        minHeight: 122,
        [theme.breakpoints.down('md')]: {
            height: 240,
            minHeight: 240
        }
    },
    columnHidden: {
        display: 'none',
        [theme.breakpoints.down('sm')]: {
            display: 'block'
        }
    }
}));

export const serviceStatuses = [
    {
        id: 1,
        name: 'initiated',
        color: 'bg-orange text-black'
    },
    {
        id: 2,
        name: 'started',
        color: 'bg-green text-white'
    },
    {
        id: 3,
        name: 'pending',
        color: 'bg-blue text-white'
    },
    {
        id: 4,
        name: 'rejected',
        color: 'bg-red text-white'
    },
    {
        id: 5,
        name: 'discarded',
        color: 'bg-pink text-white'
    },
    {
        id: 6,
        name: 'completed',
        color: 'bg-green-dark text-white'
    }
];

export const priorities = [
    {
        id: 1,
        name: 'nopriority',
        color: 'bg-grey text-black'
    },
    {
        id: 2,
        name: 'high',
        color: 'bg-blue-darker text-white'
    },
    {
        id: 3,
        name: 'medium',
        color: 'bg-blue-dark text-white'
    },
    {
        id: 4,
        name: 'low',
        color: 'bg-blue text-white'
    }
];

function ServiceRequestsList(props) {
    const form = true;
    const classes = useStyles();

    const {
        serviceRequest,
        serviceRequests,
        setServiceRequest,
        pageLayout,
        proceedServiceRequests,
        rejectServiceRequests,
        user,
        tabOn,
        getAvailableServices,
        getAvailablePurposesForInstitution,
        tableStateInRedux,
        bulkActionsDialog,
        openBulkActionsDialog,
        closeBulkActionsDialog,
        getServiceRequests,
        downloadServiceRequests,
        page,
        total,
        history,
        loading,
        hasErrors
    } = props;
    // console.log('download service request list', downloadServiceRequests());
    const [requests, setRequests] = useState([]);
    const [selectedTab, setSelectedTab] = useState(0);
    const [serviceRequestId, setServiceRequestId] = useState(0);
    const [openMenu, setOpenMenu] = useState(false);
    const [anchorEl, setAnchorEl] = useState();
    const [columnDisplay, setColumnDisplay] = useState([
        {name: 'id', value: false},
        {name: 'createdAt', value: true},
        {name: 'priority', value: true},
        {name: 'identifier', value: true},
        {name: 'serviceName', value: false},
        {name: 'purpose', value: true},
        {name: 'subject', value: true},
        {name: 'creator', value: false},
        {name: 'assignee', value: true},
        {name: 'step', value: true},
        {name: 'status', value: true},
        {name: 'ragStatus', value: true},
        {name: 'document', value: true},
        {name: 'view', value: true},
        {name: 'option', value: true},
    ]);

    const [tableState, setTableState] = useState({
        options: {tab: 'my_pending', searchText: '', filters: null},
        rowsPerPage: 10
    });
    const [searchText, setSearchText] = useState('');
    const menuOptions = ["View", "Download", "Share", "Delete"];
    const tabNames = ["my_pending", "all_pending", "my_issue", "rejected", "completed", "discarded", "all"];
    const columns = [
        {
            name: "id",
            label: "Id",
            options: {
                filter: false,
                display: columnDisplay.filter((e) => e.name === 'id')[0].value,
            }
        },
        {
            name: "createdAt",
            label: "Created At",
            options: {
                filter: false,
                sort: false,
                viewColumns: false,
                display: columnDisplay.filter((e) => e.name === 'createdAt')[0].value,
                customBodyRender: (value) => {
                    return moment(value).format('DD/MM/YYYY hh:mm:ss A');
                },
            }
        },
        {
            name: "priority",
            label: "Priority",
            options: {
                filter: true,
                filterOptions: {
                    names: ['High', 'Medium', 'Low', 'No Priority'],
                },
                sort: false,
                viewColumns: false,
                display: columnDisplay.filter((e) => e.name === 'priority')[0].value,
                customBodyRender: (value, tableMeta, updateValue) => {
                    let priorityText = (value === "nopriority") ? "no priority" : value;
                    return <div
                        className={clsx("inline text-12 p-4 rounded truncate", _.find(priorities, {name: value})?.color)}>
                        {priorityText}
                    </div>;
                },
            }
        },
        {
            name: "identifier",
            label: "Ref",
            options: {
                filter: false,
                sort: false,
                viewColumns: false,
                display: columnDisplay.filter((e) => e.name === 'identifier')[0].value,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <Link
                        style={{cursor: 'pointer'}}
                        onClick={(ev) =>
                            viewService(tableMeta)
                        }>
                        {value}
                    </Link>;
                },
            }
        },
        {
            name: "service.name",
            label: "Service",
            options: {
                filter: true,
                filterOptions: {
                    names: props.availableServices,
                },
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'serviceName')[0].value,
            }
        },
        {
            name: "purpose",
            label: "Purpose",
            options: {
                filter: true,
                filterOptions: {
                    names: props.availablePurposesForInstitution,
                },
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'purpose')[0].value,
            }
        },
        {
            name: "subject",
            label: "Subject",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'subject')[0].value,
            }
        },
        {
            name: "creator",
            label: "Creator",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'creator')[0].value,
            }
        },
        {
            name: "assignee",
            label: "Assignee",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'assignee')[0].value,
            }
        },
        {
            name: "step",
            label: "Step",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'step')[0].value,
            }
        },
        {
            name: "status",
            label: "Status",
            options: {
                filter: true,
                filterOptions: {
                    names: ['Initiated', 'Started', 'Pending', 'Rejected', 'Discarded', 'Completed'],
                },
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'status')[0].value,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <div
                        className={clsx("inline text-12 p-4 rounded truncate", _.find(serviceStatuses, {name: value})?.color)}>
                        {value}
                    </div>;
                },
            }
        },
        {
            name: "ragStatus",
            label: "RAG",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'ragStatus')[0].value,
                customBodyRender: (value, tableMeta, updateValue) => {
                    const defaultProps = {
                        bgcolor: value,
                        style: {width: '25px', height: '25px'},
                    };
                    return <Box display="flex" justifyContent="center">
                        <Box borderRadius="50%" {...defaultProps} /></Box>;
                },
            }
        },
        {
            name: "document",
            label: "Document",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'document')[0].value,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <div>
                        {value && <Icon>attach_file</Icon>}
                    </div>;
                },
            }
        },
        {
            name: "view",
            label: "View",
            options: {
                filter: false,
                sort: false,
                display: columnDisplay.filter((e) => e.name === 'view')[0].value,
                empty: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <IconButton
                        aria-label="delete"
                        size="small"
                        color="secondary"
                        className="mr-12"
                        onClick={(ev) =>
                            pageLayout.current.openRightSidebar()
                        }>
                        <Icon>info</Icon>
                    </IconButton>;
                },
            }
        },
        {
            name: "option",
            label: "",
            options: {
                filter: false,
                sort: false,
                display: false,
                viewColumns: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div>
                            <IconButton
                                className={classes.iconButton}
                                aria-label="more"
                                aria-controls="long-menu"
                                aria-haspopup="true"
                                onClick={handleMenuClick}
                            >
                                <MoreVertRounded/>
                            </IconButton>
                            <Menu
                                id="long-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={openMenu}
                                onClose={handleMenuClose}
                            >
                                {menuOptions.map(option => (
                                    <MenuItem
                                        key={option}
                                        onClick={() => handleContextMenuClick(tableMeta)}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </div>
                    );
                },
            }
        },
    ];

    useEffect(() => {
        setTableState(tableStateInRedux);
        setSelectedTab(tabOn);
        getAvailableServices();

        // downloadServiceRequests();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {                 // fifth, we create a setTimeout function to wrap
            if (searchText !== '' && searchText === tableState.options.searchText) {  // first, here we are making sure that fetching will only occur after typing
                search();
            }
        }, 1000);                                         // second, desired timeout amount

        return () => {                                            // third, we return an anonymous clean up function
            // we always cleared the previous timer because it doesn’t matter to us anymore
            // if there is a new keystroke the old timer can be dismissed.
            clearTimeout(timer);
        };

    }, [searchText, tableState]);                           // forth, there we will have our dependency array for our dependencies.

    const handleRowClick = (rowData, rowMeta) => {
        setServiceRequestId(serviceRequests[rowMeta.dataIndex].id);
        if (rowMeta) setServiceRequest(serviceRequests[rowMeta.dataIndex]);
    };

    function handleMenuClick(event) {
        setAnchorEl(event.currentTarget);
        setOpenMenu(true);
    }

    function handleMenuClose(event) {
        setOpenMenu(false);
    }

    function handleContextMenuClick(id) {
    }

    function viewService(rowMeta) {
        setTableState(tableState);
        props.updateTableState(tableState);

        let serviceReq = {};
        if (rowMeta) {
            serviceReq = serviceRequests[rowMeta.rowIndex];
            setServiceRequest(serviceReq);
        }
        if ((serviceReq.attributes.assigneeId !== null && serviceReq.attributes.assigneeId !== parseInt(user.id))
            || !serviceReq.attributes.permissions.data.attributes.canBeAssigned
            || serviceReq.attributes.status === 'completed')
            history.push(`/service-request/${serviceReq.attributes.identifier}/overview`);
        else
            history.push(`/service-request/${serviceReq.attributes.identifier}/edit`)
    }

    function handleBulkProceed(indices) {
        proceedServiceRequests(indices);
    }

    function handleBulkReject(indices) {
        rejectServiceRequests(indices);
    }

    function handleBulkDiscard(indices) {
    }

    function changePage(newTableState) {
        let state = {...tableState, ...newTableState, rowsPerPage: newTableState.rowsPerPage};
        setTableState(state);
        getServiceRequests(state.options, state.page, state.rowsPerPage);
    }

    function search() {
        getServiceRequests(tableState.options, tableState.page, tableState.rowsPerPage);
    }

    function renderCustomSelectToolbar(selectedRows, displayData, setSelectedRows) {
        let proceedDisabled = false;
        let rejectDisabled = false;
        let discardDisabled = false;
        let permissions = {};
        let indices = selectedRows.data.map(({index}) => {
            permissions = (((serviceRequests[index].attributes.permissions || {}).data || {}).attributes || {});
            if (serviceRequests[index].attributes.creatorId && serviceRequests[index].attributes.creatorId != user.id) discardDisabled = true;
            if (permissions.canBeAssigned == false || (serviceRequests[index].attributes.assigneeId && serviceRequests[index].attributes.assigneeId != user.id) || serviceRequests[index].attributes.status == 'completed') proceedDisabled = true;
            if (permissions.canBeAssigned == false || (serviceRequests[index].attributes.assigneeId && serviceRequests[index].attributes.assigneeId != user.id) || serviceRequests[index].attributes.status == 'completed') rejectDisabled = true;
            return serviceRequests[index].id;
        });
        if (pageLayout.current.isRightSidebarPinned()) pageLayout.current.toggleRightSidebarPin();
        return <React.Fragment>
            <span className="justify-between ml-8 mr-20">
            <IconButton
                aria-label="reject"
                size="small"
                color="primary"
                className="mr-12"
                onClick={(event) => {
                    openBulkActionsDialog({submit: handleBulkReject, indices: indices, action: 'Reject & Send Back'});
                }}
                disabled={rejectDisabled}
            >
                <ErrorIcon/>
            </IconButton>
            <IconButton
                aria-label="proceed"
                size="small"
                color="secondary"
                className="mr-12"
                onClick={(event) => {
                    openBulkActionsDialog({submit: handleBulkProceed, indices: indices, action: 'Proceed & Forward'});
                }}
                disabled={proceedDisabled}
            >
                <PlayArrowIcon/>
            </IconButton>
            <IconButton
                aria-label="delete"
                size="small"
                color="default"
                onClick={(event) => {
                    console.log("Implement Me!");
                }}
                disabled={discardDisabled}
            >
                <DeleteIcon/>
            </IconButton>
            </span>
        </React.Fragment>
    }

    const options = {
        filterType: 'dropdown',
        // but for the issue of showing vertical line in the middle of MUI datatable we used `scrollMaxHeight` instead of `scrollFullHeight`
        serverSide: true,
        // downloadOptions: {
        //     filename: 'Service List.csv',
        //     // new API change added here
        //     customCSVdata: downloadServiceRequests,
        // },
        onDownload: (buildHead, buildBody, columns, data) => {
            downloadServiceRequests(); // this makes a REST call to the server and downloads the data
            return true;
        },
        responsive: 'scrollMaxHeight', // Previously the value of the property 'responsive' was  `scrollFullHeight`,
        count: total,
        page: page,
        rowsPerPage: tableState.rowsPerPage,
        selectableRows: 'none', // it hides checkbox
        // serverSideFilterList: this.state.serverSideFilterList,
        searchText: tableState.options.searchText,
        searchPlaceholder: 'Type Ref or Subject or Instruction',
        customToolbarSelect: renderCustomSelectToolbar,
        onRowClick: handleRowClick,
        onTableChange:
            (action, newTableState) => {
                // a developer could react to change on an action basis or
                // examine the state as a whole and do whatever they want
                switch (action) {
                    case "changePage":
                    case "changeRowsPerPage":
                        changePage(newTableState);
                        break;
                    case "search":
                        // useState of setSearchText and setTableState sets the corresponding values and
                        // useEffect use timer so that api is not called in every key stoke.
                        let state = {
                            ...tableState, ...newTableState, rowsPerPage: newTableState.rowsPerPage, options: {
                                ...tableState.options,
                                searchText: newTableState.searchText
                            }
                        };
                        setSearchText(newTableState.searchText);
                        setTableState(state);
                        break;
                }
            },
        customToolbar:
            () => <RefreshToolbar
                refreshListEvent={() => {

                    let tableState = {
                        options: {tab: tabNames[selectedTab], searchText: '', filters: null},
                        rowsPerPage: 10
                    };
                    setTableState(tableState);
                    getServiceRequests(tableState.options, tableState.page, tableState.rowsPerPage);
                }
                }/>,
        textLabels: {
            body: {
                noMatch: loading ?
                    <Loader loading={loading} size={40}/> :
                    'Sorry, there is no matching data to display',
            },
        },
        onFilterDialogOpen: () => {
            getAvailablePurposesForInstitution();
        },
        onFilterDialogClose: () => {
            let state = {
                ...tableState, rowsPerPage: tableState.rowsPerPage, options: {
                    ...tableState.options,
                    searchText: tableState.searchText,
                    // filters: null
                }
            };
            setTableState(state);
        },
        onFilterChange: (column, filterList, type) => {
            if (type === 'chip') {
                console.log('updating filters via chip');
            }
        },
        // confirmFilters: false,
        customFilterDialogFooter: filterList => {
            return (
                <div style={{marginTop: '40px'}}>
                    <Button variant="contained" onClick={() => {
                        handleFilterSubmit(filterList)
                    }}>Apply Filters</Button>
                </div>
            );
        },
        onColumnViewChange: (changedColumn, action) => {
            if (changedColumn === 'service.name')
                changedColumn = 'serviceName';
            columnDisplay.filter((e) => e.name === changedColumn)[0].value = action === 'add';
        },
        customFilterListRender: v => { return (v !== undefined && v.length > 0 && v[0] !== '') ? 'Filter' : false },
      //   setFilterChipProps: (colIndex, colName, data) => {
      //   console.log(colIndex, colName, data);
      //   debugger;
      //   return {
      //     color: 'primary',
      //     variant: 'outlined',
      //     className: 'testClass123',
      //   };
      // }
    };

    useEffect(() => {
        if (serviceRequests) {
            setRequests(serviceRequests.map(({id, attributes}) => {
                return {id: id, ...attributes}
            }))
        }
    }, [selectedTab, serviceRequests]);

    function handleTabChange(event, value) {
        setSelectedTab(value);
        let state = {...tableState, options: {...tableState.options, tab: tabNames[value]}};
        setTableState(state);
        getServiceRequests(state.options, state.page, state.rowsPerPage);
    }

    function handleFilterSubmit(filterList) {
        let state = {
            ...tableState, rowsPerPage: tableState.rowsPerPage, options: {
                ...tableState.options,
                searchText: tableState.searchText,
                filters: {
                    service: filterList[4][0],
                    purpose: filterList[5][0],
                    priority: filterList[2][0] === 'No Priority' ? 'nopriority' : filterList[2][0],
                    status: filterList[10][0],
                }
            }
        };

        setTableState(state);
        getServiceRequests(state.options, state.page, state.rowsPerPage);
    }

    return (
        <FusePageCarded
            classes={{
                toolbar: "p-0",
                header: "min-h-48 h-48 sm:h-48 sm:min-h-48"
            }}
            header={
                form && (
                    <div className="flex flex-1 w-full items-center justify-between">
                    </div>
                )
            }
            contentToolbar={
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    indicatorColor="secondary"
                    textColor="secondary"
                    variant="scrollable"
                    scrollButtons="on"
                    classes={{
                        root: "h-64 w-full border-b-1"
                    }}
                >
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="My Pending"/>
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="All Pending"/>
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="My Issue"
                    />
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="Rejected"/>
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="Completed"/>
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="Discarded"/>
                    <Tab
                        classes={{
                            root: "h-64"
                        }}
                        label="All"/>
                </Tabs>
            }
            content={
                <React.Fragment>
                    <FuseAnimate animation="transition.slideUpIn" delay={300}>
                        {loading ? <Loader css='margin-left: 48%; margin-top: 10%' loading={loading}/> :
                            <MUIDataTable
                                title={"Service Request List"}
                                data={requests}
                                columns={columns}
                                options={options}
                            />
                        }
                    </FuseAnimate>
                </React.Fragment>
            }
            innerScroll
        />
    );
}

const mapStateToProps = (state) => {
    let services = state?.serviceRequests?.serviceRequests?.availableServices;
    let purposes = state?.serviceRequests?.serviceRequests?.availablePurposesForInstitution;

    let purposeList = [];
    let serviceNameList = [];
    if (services) {
        services.map(s => {
            let service = {};
            service.id = s.id;
            service.name = s.attributes.name;
            service.acronym = s.attributes.acronym;
            serviceNameList.push(service.name);
        });
    }
    if (purposes) {
        purposes.map(s => {
            let purpose = {};
            purpose.id = s.id;
            purpose.content = s.attributes.content;
            if (purposeList.indexOf(purpose.content) < 0)
                purposeList.push(purpose.content);
        });
    }
    return {
        availableServices: serviceNameList,
        availablePurposesForInstitution: purposeList,
        loading: state?.serviceRequests?.serviceRequests?.loading,
        hasErrors: state?.serviceRequests?.serviceRequests?.hasErrors,
    }
};

export default connect(mapStateToProps, null)(withReducer('serviceRequest', reducer)(ServiceRequestsList));
